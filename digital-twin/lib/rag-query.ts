'use server';

import Groq from 'groq-sdk';
import { Index } from '@upstash/vector';
import { setupVectorDatabase } from './vector-setup';
import { fallbackSearch } from './fallback-search';
import { loadAndValidateEnv } from './env-validation';
import type { RAGQueryResult, RAGError, VectorQueryOptions, PerformanceTimer } from './types';

/** Configuration constants for optimization */
const CONFIG = {
  DEFAULT_TOP_K: 3,
  MIN_CONFIDENCE_SCORE: 0.3,
  MAX_RETRIES: 3,
  REQUEST_TIMEOUT: 30000, // 30 seconds
  VECTOR_QUERY_TIMEOUT: 10000, // 10 seconds
  LLM_TIMEOUT: 20000, // 20 seconds
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
} as const;

/** Performance timer implementation */
class Timer implements PerformanceTimer {
  private startTime = 0;
  
  start(): void {
    this.startTime = performance.now();
  }
  
  end(): number {
    const elapsed = performance.now() - this.startTime;
    this.startTime = 0;
    return elapsed;
  }
  
  getElapsed(): number {
    return performance.now() - this.startTime;
  }
}

/** Enhanced logger with structured logging */
class RAGLogger {
  private static logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';
  
  static debug(message: string, data?: unknown): void {
    if (this.logLevel === 'debug') {
      console.log(`🐛 [DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
  
  static info(message: string, data?: unknown): void {
    console.log(`ℹ️ [INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
  
  static warn(message: string, data?: unknown): void {
    console.warn(`⚠️ [WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
  
  static error(message: string, error?: unknown): void {
    console.error(`❌ [ERROR] ${message}`, error);
  }
  
  static performance(operation: string, duration: number, metadata?: unknown): void {
    console.log(`⚡ [PERF] ${operation}: ${duration.toFixed(2)}ms`, metadata ? JSON.stringify(metadata, null, 2) : '');
  }
}

/** Create structured error with context */
function createRAGError(code: RAGError['code'], message: string, details?: unknown): RAGError {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString()
  };
}

/** In-memory cache for recent queries (simple LRU) */
class QueryCache {
  private cache = new Map<string, { result: RAGQueryResult; timestamp: number }>();
  private maxSize = 50;
  
  get(key: string): RAGQueryResult | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > CONFIG.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.result;
  }
  
  set(key: string, result: RAGQueryResult): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
}

const queryCache = new QueryCache();

const DEFAULT_MODEL = 'llama-3.1-8b-instant';

/** Cached instances for performance */
let groqClient: Groq | null = null;
let vectorIndex: Index | 'fallback_mode' | null = null;
let lastInitAttempt = 0;
const INIT_RETRY_DELAY = 5000; // 5 seconds

/**
 * Enhanced Groq client setup with retry logic and validation
 * @returns Initialized Groq client or null if failed
 */
function setupGroqClient(): Groq | null {
  const timer = new Timer();
  timer.start();
  
  // Return cached client if available
  if (groqClient) {
    RAGLogger.debug('Using cached Groq client');
    return groqClient;
  }
  
  // Prevent rapid retry attempts
  const now = Date.now();
  if (now - lastInitAttempt < INIT_RETRY_DELAY) {
    RAGLogger.warn('Groq client initialization too soon after last attempt');
    return null;
  }
  lastInitAttempt = now;
  
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    RAGLogger.error('GROQ_API_KEY not found in environment variables');
    return null;
  }
  
  // Validate API key format
  if (!groqApiKey.startsWith('gsk_')) {
    RAGLogger.error('Invalid GROQ_API_KEY format - should start with "gsk_"');
    return null;
  }
  
  try {
    groqClient = new Groq({ 
      apiKey: groqApiKey,
      timeout: CONFIG.LLM_TIMEOUT
    });
    
    const duration = timer.end();
    RAGLogger.info('Groq client initialized successfully');
    RAGLogger.performance('Groq client setup', duration);
    return groqClient;
  } catch (error) {
    const duration = timer.end();
    RAGLogger.error('Error initializing Groq client', error);
    RAGLogger.performance('Groq client setup (failed)', duration);
    return null;
  }
}

/**
 * Enhanced vector query with timeout, retry logic, and quality filtering
 * @param index - Upstash vector index
 * @param queryText - Search query text
 * @param options - Query configuration options
 * @returns Filtered and scored vector results
 */
async function queryVectors(
  index: Index, 
  queryText: string, 
  options: VectorQueryOptions = {}
): Promise<Array<{ id: string; score: number; metadata?: unknown }> | null> {
  const timer = new Timer();
  timer.start();
  
  const {
    topK = CONFIG.DEFAULT_TOP_K,
    minScore = CONFIG.MIN_CONFIDENCE_SCORE,
    includeMetadata = true,
    timeout = CONFIG.VECTOR_QUERY_TIMEOUT
  } = options;
  
  RAGLogger.debug('Starting vector query', { queryText, topK, minScore });
  
  // Input validation
  if (!queryText.trim()) {
    RAGLogger.warn('Empty query text provided to vector search');
    return null;
  }
  
  if (queryText.length > 1000) {
    RAGLogger.warn('Query text too long, truncating', { originalLength: queryText.length });
    queryText = queryText.substring(0, 1000);
  }
  
  let attempt = 0;
  const maxRetries = CONFIG.MAX_RETRIES;
  
  while (attempt < maxRetries) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Vector query timeout')), timeout);
      });
      
      // Execute query with timeout
      const queryPromise = index.query({
        data: queryText,
        topK: Math.max(topK, 1),
        includeMetadata
      });
      
      const results = await Promise.race([queryPromise, timeoutPromise]);
      const duration = timer.end();
      
      if (!results || !Array.isArray(results)) {
        RAGLogger.warn('Invalid vector query results format');
        return null;
      }
      
      // Filter results by minimum confidence score
      const filteredResults = results.filter(result => 
        result && 
        typeof result.score === 'number' && 
        result.score >= minScore
      ).map(result => ({
        id: String(result.id),
        score: result.score,
        metadata: result.metadata
      }));
      
      RAGLogger.info(`Vector query completed successfully`);
      RAGLogger.performance('Vector query', duration, {
        resultsTotal: results.length,
        resultsFiltered: filteredResults.length,
        attempt: attempt + 1,
        avgScore: filteredResults.length > 0 
          ? filteredResults.reduce((sum, r) => sum + r.score, 0) / filteredResults.length 
          : 0
      });
      
      return filteredResults;
      
    } catch (error) {
      attempt++;
      const duration = timer.getElapsed();
      
      RAGLogger.error(`Vector query attempt ${attempt} failed`, {
        error: error instanceof Error ? error.message : String(error),
        attempt,
        duration
      });
      
      if (attempt >= maxRetries) {
        RAGLogger.error('All vector query attempts exhausted');
        return null;
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      RAGLogger.debug(`Retrying vector query in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return null;
}

/**
 * Enhanced LLM response generation with retry logic, quality validation, and performance monitoring
 * @param client - Initialized Groq client
 * @param prompt - Formatted prompt for the LLM
 * @param model - LLM model to use
 * @returns Generated response or error message
 */
async function generateResponseWithGroq(
  client: Groq, 
  prompt: string, 
  model: string = DEFAULT_MODEL
): Promise<string> {
  const timer = new Timer();
  timer.start();
  
  RAGLogger.debug('Starting LLM response generation', { model, promptLength: prompt.length });
  
  // Input validation
  if (!prompt.trim()) {
    return 'No context provided for response generation.';
  }
  
  if (prompt.length > 8000) {
    RAGLogger.warn('Prompt too long, truncating', { originalLength: prompt.length });
    prompt = prompt.substring(0, 8000) + '\n\n[Content truncated for length]';
  }
  
  let attempt = 0;
  const maxRetries = CONFIG.MAX_RETRIES;
  
  while (attempt < maxRetries) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `You are Nyah Ostonal, a 4th-year IT student specializing in AI & Robotics at St. Paul University Philippines.
            
            YOUR COMMUNICATION STYLE:
            - Professional yet personable and enthusiastic about your work
            - Speak in first person: "I developed", "I'm learning", "my project"
            - Show genuine interest in your field without being overly casual
            - Balance confidence in your abilities with awareness that you're still learning
            - Share both achievements and challenges in a professional manner
            
            STRICT RULES (NEVER BREAK):
            1. Use ONLY information explicitly provided in the context - never invent or assume details
            2. If asked about something not in the context, respond professionally: "I haven't worked with that technology yet" or "That's not part of my experience so far"
            3. You're a STUDENT with academic and project experience, not professional work experience
            4. Keep responses concise (2-4 sentences) unless detail is clearly needed
            5. Maintain professional tone while being approachable and genuine
            
            ACCURACY IS PARAMOUNT - only discuss verified facts from the provided context.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2, // Low temperature for consistency, slightly higher for personality
        max_tokens: 500,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      });
      
      const response = completion.choices[0]?.message?.content?.trim();
      const duration = timer.end();
      
      if (!response) {
        throw new Error('Empty response from LLM');
      }
      
      // Quality checks
      const wordCount = response.split(/\s+/).length;
      const hasRefusal = response.toLowerCase().includes('i cannot') || 
                        response.toLowerCase().includes('i don\'t know') ||
                        response.toLowerCase().includes('not mentioned in my profile');
      
      RAGLogger.info('LLM response generated successfully');
      RAGLogger.performance('LLM generation', duration, {
        model,
        attempt: attempt + 1,
        wordCount,
        hasRefusal,
        tokensUsed: completion.usage?.total_tokens || 0
      });
      
      return response;
      
    } catch (error) {
      attempt++;
      const duration = timer.getElapsed();
      
      RAGLogger.error(`LLM generation attempt ${attempt} failed`, {
        error: error instanceof Error ? error.message : String(error),
        attempt,
        duration,
        model
      });
      
      if (attempt >= maxRetries) {
        const totalDuration = timer.end();
        RAGLogger.error('All LLM generation attempts exhausted');
        RAGLogger.performance('LLM generation (failed)', totalDuration);
        return `❌ I'm experiencing technical difficulties generating a response. Please try again in a moment.`;
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      RAGLogger.debug(`Retrying LLM generation in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return 'Unable to generate response after multiple attempts.';
}

/**
 * Main RAG query function with comprehensive error handling, performance monitoring, and caching
 * @param question - User's question about Nyah's profile
 * @returns Comprehensive result with success status, response, metadata, and performance metrics
 */
export async function ragQuery(question: string): Promise<RAGQueryResult> {
  const overallTimer = new Timer();
  overallTimer.start();
  
  RAGLogger.info('Starting RAG query', { question: question.substring(0, 100) + '...' });
  
  // Input validation
  if (!question || typeof question !== 'string') {
    return {
      success: false,
      response: 'Please provide a valid question.',
      mode: 'error',
      error: createRAGError('UNKNOWN_ERROR', 'Invalid question format')
    };
  }
  
  const sanitizedQuestion = question.trim();
  if (!sanitizedQuestion) {
    return {
      success: false,
      response: 'Please provide a question about my professional background.',
      mode: 'error',
      error: createRAGError('UNKNOWN_ERROR', 'Empty question')
    };
  }
  
  if (sanitizedQuestion.length > 500) {
    RAGLogger.warn('Question too long, truncating', { originalLength: sanitizedQuestion.length });
  }
  
  // Check cache first
  const cacheKey = sanitizedQuestion.toLowerCase();
  const cachedResult = queryCache.get(cacheKey);
  if (cachedResult) {
    const duration = overallTimer.end();
    RAGLogger.info('Returning cached result');
    RAGLogger.performance('RAG query (cached)', duration);
    
    return {
      ...cachedResult,
      metrics: {
        ...cachedResult.metrics,
        queryTime: duration,
        resultsCount: cachedResult.sources?.length || 0
      }
    };
  }
  
  try {
    // Environment validation with timeout
    const envTimer = new Timer();
    envTimer.start();
    
    let envValidation;
    try {
      envValidation = await Promise.race([
        loadAndValidateEnv(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Environment validation timeout')), 5000)
        )
      ]);
      
      const envDuration = envTimer.end();
      RAGLogger.performance('Environment validation', envDuration);
      
      // If env vars are missing, force fallback mode
      if (!envValidation.isValid) {
        RAGLogger.warn('Missing environment variables, using fallback mode');
        vectorIndex = 'fallback_mode';
      }
    } catch (envError) {
      const envDuration = envTimer.end();
      RAGLogger.warn('Environment validation error, using fallback mode', envError);
      RAGLogger.performance('Environment validation (fallback)', envDuration);
      // Continue with fallback mode instead of failing
      vectorIndex = 'fallback_mode';
    }
    
    // Setup Groq client (optional in fallback mode)
    const client = setupGroqClient();
    if (!client && vectorIndex !== 'fallback_mode') {
      RAGLogger.warn('Groq client unavailable, switching to fallback mode');
      vectorIndex = 'fallback_mode';
    }
    
    // Setup vector database
    if (!vectorIndex) {
      const dbTimer = new Timer();
      dbTimer.start();
      
      try {
        vectorIndex = await setupVectorDatabase();
        const dbDuration = dbTimer.end();
        RAGLogger.performance('Vector database setup', dbDuration);
      } catch (dbError) {
        const dbDuration = dbTimer.end();
        RAGLogger.error('Vector database setup failed, using fallback', dbError);
        RAGLogger.performance('Vector database setup (failed)', dbDuration);
        vectorIndex = 'fallback_mode';
      }
    }
    
    let context: string;
    let mode: 'vector' | 'fallback';
    let sources: string[] = [];
    let vectorSearchTime = 0;
    let confidence = 0;
    
    if (vectorIndex === 'fallback_mode') {
      // Fallback mode - direct profile search
      RAGLogger.info('Using fallback search mode');
      mode = 'fallback';
      
      const fallbackTimer = new Timer();
      fallbackTimer.start();
      
      try {
        const relevantSections = await fallbackSearch(sanitizedQuestion);
        vectorSearchTime = fallbackTimer.end();
        
        if (!relevantSections || relevantSections.length === 0) {
          return {
            success: false,
            response: 'I don\'t have specific information about that topic in my profile.',
            mode: 'fallback',
            error: createRAGError('FALLBACK_ERROR', 'No relevant sections found'),
            metrics: { 
              queryTime: overallTimer.end(),
              vectorSearchTime,
              resultsCount: 0
            }
          };
        }
        
        context = relevantSections.join('\n\n');
        sources = relevantSections.map((_, index) => `Profile section ${index + 1}`);
        confidence = relevantSections.length > 0 ? 0.7 : 0;
        
        RAGLogger.info('Fallback search completed', { 
          sectionsFound: relevantSections.length,
          contextLength: context.length 
        });
        
      } catch (fallbackError) {
        vectorSearchTime = fallbackTimer.end();
        RAGLogger.error('Fallback search failed', fallbackError);
        
        return {
          success: false,
          response: 'Unable to search my profile information. Please try again.',
          mode: 'fallback',
          error: createRAGError('FALLBACK_ERROR', 'Fallback search failed', fallbackError),
          metrics: { 
            queryTime: overallTimer.end(),
            vectorSearchTime 
          }
        };
      }
      
    } else {
      // Vector database mode
      RAGLogger.info('Using vector search mode');
      mode = 'vector';
      
      const vectorTimer = new Timer();
      vectorTimer.start();
      
      const results = await queryVectors(vectorIndex, sanitizedQuestion, {
        topK: CONFIG.DEFAULT_TOP_K,
        minScore: CONFIG.MIN_CONFIDENCE_SCORE
      });
      
      vectorSearchTime = vectorTimer.end();
      
      if (!results || results.length === 0) {
        RAGLogger.warn('Vector search returned no results');
        
        return {
          success: false,
          response: 'I don\'t have specific information about that topic. Could you try rephrasing your question?',
          mode: 'vector',
          error: createRAGError('VECTOR_QUERY_ERROR', 'No vector results found'),
          metrics: {
            queryTime: overallTimer.end(),
            vectorSearchTime,
            resultsCount: 0
          }
        };
      }
      
      // Process vector results
      const topDocs: string[] = [];
      let totalScore = 0;
      
      results.forEach(result => {
        const metadata = (result.metadata as Record<string, unknown>) || {};
        const title = String(metadata.title || 'Information');
        const content = String(metadata.content || '');
        const score = result.score || 0;
        
        totalScore += score;
        
        RAGLogger.debug('Vector result processed', {
          title: title.substring(0, 50),
          score: score.toFixed(3),
          contentLength: content.length
        });
        
        if (content) {
          topDocs.push(`${title}: ${content}`);
          sources.push(title);
        }
      });
      
      if (topDocs.length === 0) {
        return {
          success: false,
          response: 'I found some information but couldn\'t extract meaningful details.',
          mode: 'vector',
          error: createRAGError('VECTOR_QUERY_ERROR', 'No content in vector results'),
          metrics: {
            queryTime: overallTimer.end(),
            vectorSearchTime,
            resultsCount: results.length
          }
        };
      }
      
      context = topDocs.join('\n\n');
      confidence = results.length > 0 ? totalScore / results.length : 0;
      
      RAGLogger.info('Vector search completed successfully', {
        resultsCount: results.length,
        avgScore: confidence.toFixed(3),
        contextLength: context.length
      });
    }
    
    // Generate LLM response
    RAGLogger.info('Generating AI response');
    const llmTimer = new Timer();
    llmTimer.start();
    
    let response: string;
    let llmResponseTime = 0;
    
    if (client) {
      const prompt = `You are Nyah Ostonal, a 4th-year IT student specializing in AI & Robotics. Respond professionally and informatively.

COMMUNICATION GUIDELINES:
- Be professional yet approachable and enthusiastic about your work
- Speak in first person: "I developed", "I'm working on", "my experience"
- Show genuine passion for your projects while maintaining professionalism
- Share accomplishments and learning experiences in a balanced manner
- Keep responses concise and focused on the question asked

STRICT RULES:
1. Use ONLY facts from the context below - never add, assume, or invent information
2. Only mention technologies, projects, and experiences explicitly listed in the context
3. If information isn't in the context, respond: "I haven't worked with that yet" or "That's outside my current experience"
4. You are a student with academic and project experience, not professional work experience
5. Always respond in first person perspective

CONTEXT FROM PROFILE:
${context}

QUESTION: ${sanitizedQuestion}

RESPONSE (professional, informative, and grounded in the facts above):`;
      
      response = await generateResponseWithGroq(client, prompt);
      llmResponseTime = llmTimer.end();
    } else {
      // Fallback to direct context when Groq is unavailable
      RAGLogger.warn('Groq client unavailable, returning direct context');
      response = `Here's what I found in my profile:\n\n${context}`;
      llmResponseTime = llmTimer.end();
    }
    
    const totalDuration = overallTimer.end();
    
    // Prepare result with comprehensive metrics
    const result: RAGQueryResult = {
      success: true,
      response,
      mode,
      sources,
      metrics: {
        queryTime: totalDuration,
        vectorSearchTime,
        llmResponseTime,
        resultsCount: sources.length,
        confidence
      }
    };
    
    // Cache successful results
    queryCache.set(cacheKey, result);
    
    RAGLogger.info('RAG query completed successfully');
    RAGLogger.performance('RAG query (complete)', totalDuration, {
      mode,
      resultsCount: sources.length,
      confidence: confidence.toFixed(3),
      cached: false
    });
    
    return result;
    
  } catch (error) {
    const duration = overallTimer.end();
    
    RAGLogger.error('RAG query failed with unexpected error', error);
    RAGLogger.performance('RAG query (error)', duration);
    
    return {
      success: false,
      response: 'I\'m experiencing technical difficulties. Please try again in a moment.',
      mode: 'error',
      error: createRAGError('UNKNOWN_ERROR', 'Unexpected error during RAG query', error),
      metrics: { queryTime: duration }
    };
  }
}