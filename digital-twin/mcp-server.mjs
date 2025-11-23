#!/usr/bin/env node
/**
 * Cristina's Digital Twin MCP Server
 * Standalone MCP server for RAG-powered AI assistant
 * Based on rolldice-mcpserver pattern from agents.md reference
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import Groq from 'groq-sdk';
import { Index } from '@upstash/vector';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

class DigitalTwinMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'cristina-digital-twin',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.groqClient = null;
    this.vectorIndex = null;
    this.profileData = null;
    
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'digital-twin-query',
            description: "Ask questions about Cristina Tuazon's professional profile using RAG",
            inputSchema: {
              type: 'object',
              properties: {
                question: {
                  type: 'string',
                  description: 'Question about professional background, skills, experience, or projects',
                },
              },
              required: ['question'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'digital-twin-query') {
        const { question } = args;
        
        try {
          const response = await this.handleDigitalTwinQuery(question);
          return response;
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error processing your question: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }

      throw new Error(`Unknown tool: ${name}`);
    });
  }

  // Initialize clients
  async initializeClients() {
    // Initialize Groq client
    if (!this.groqClient && process.env.GROQ_API_KEY) {
      this.groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }

    // Initialize Vector client
    if (!this.vectorIndex && process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN) {
      this.vectorIndex = new Index({
        url: process.env.UPSTASH_VECTOR_REST_URL,
        token: process.env.UPSTASH_VECTOR_REST_TOKEN,
      });
    }

    // Load profile data
    if (!this.profileData) {
      try {
        const profilePath = path.join('..', 'data', 'digitaltwin.json');
        const data = fs.readFileSync(profilePath, 'utf8');
        this.profileData = JSON.parse(data);
      } catch (error) {
        console.error('Failed to load profile data:', error);
      }
    }
  }

  // Fallback search when vector database is unavailable
  fallbackSearch(question) {
    if (!this.profileData) return [];

    const lowerQuestion = question.toLowerCase();
    
    const categories = {
      experience: ['work', 'job', 'company', 'freelance', 'employment'],
      skills: ['skill', 'technical', 'programming', 'technology', 'language', 'framework'],
      projects: ['project', 'portfolio', 'built', 'developed', 'created'],
      career: ['goal', 'future', 'learning', 'plan'],
      education: ['university', 'degree', 'school', 'education']
    };
    
    const results = [];
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
        if (category === 'experience' && this.profileData.experience) {
          results.push(`Professional Experience: ${JSON.stringify(this.profileData.experience, null, 2)}`);
        }
        if (category === 'skills' && this.profileData.skills) {
          results.push(`Technical Skills: ${JSON.stringify(this.profileData.skills, null, 2)}`);
        }
        if (category === 'projects' && this.profileData.projects_portfolio) {
          results.push(`Projects Portfolio: ${JSON.stringify(this.profileData.projects_portfolio, null, 2)}`);
        }
        if (category === 'career' && this.profileData.career_goals) {
          results.push(`Career Goals: ${JSON.stringify(this.profileData.career_goals, null, 2)}`);
        }
        if (category === 'education' && this.profileData.education) {
          results.push(`Education: ${JSON.stringify(this.profileData.education, null, 2)}`);
        }
      }
    }
    
    if (results.length === 0 && this.profileData.personal) {
      results.push(`Personal Summary: ${JSON.stringify(this.profileData.personal, null, 2)}`);
    }
    
    return results;
  }

  // Generate response with Groq
  async generateResponse(context, question) {
    if (!this.groqClient) {
      throw new Error('Groq client not initialized');
    }

    const prompt = `You are answering as Cristina Tuazon. 

STRICT RULES:
1. Use ONLY the facts listed below - do not add ANY other information
2. Do not mention any technologies, frameworks, or experience not explicitly listed
3. If something isn't listed below, say "That's not mentioned in my profile"
4. Speak as Cristina in first person

VERIFIED FACTS FROM MY PROFILE:
${context}

QUESTION: ${question}

ANSWER (using only the verified facts above):`;

    const completion = await this.groqClient.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are Cristina Tuazon\'s AI digital twin. CRITICAL: Only use information explicitly provided in the user\'s context. Never add, assume, or invent details not present in the provided information. If asked about something not in the context, clearly state you don\'t have that information. Speak in first person as Cristina.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    });
    
    return completion.choices[0]?.message?.content?.trim() || 'No response generated';
  }

  // Main query handler
  async handleDigitalTwinQuery(question) {
    await this.initializeClients();

    if (!question || question.trim() === '') {
      return {
        content: [{
          type: 'text',
          text: 'Please provide a question about my professional profile.'
        }]
      };
    }

    try {
      let context = '';
      let mode = 'fallback';

      // Try vector search first
      if (this.vectorIndex) {
        try {
          const vectorResults = await this.vectorIndex.query({
            data: question,
            topK: 3,
            includeMetadata: true,
          });
          
          if (vectorResults && vectorResults.length > 0) {
            mode = 'vector';
            const topDocs = vectorResults.map(result => {
              const metadata = result.metadata || {};
              const title = metadata.title || 'Information';
              const content = metadata.content || '';
              return `${title}: ${content}`;
            });
            context = topDocs.join('\n\n');
          } else {
            throw new Error('No vector results');
          }
        } catch (vectorError) {
          console.error('Vector search failed:', vectorError);
          const fallbackResults = this.fallbackSearch(question);
          context = fallbackResults.join('\n\n');
        }
      } else {
        const fallbackResults = this.fallbackSearch(question);
        context = fallbackResults.join('\n\n');
      }

      if (!context) {
        return {
          content: [{
            type: 'text',
            text: "I don't have information about that topic in my profile."
          }]
        };
      }

      // Generate response with Groq
      const response = await this.generateResponse(context, question);
      const modeIndicator = mode === 'vector' ? '🔍' : '📋';
      
      return {
        content: [{
          type: 'text',
          text: `${modeIndicator} ${response}`
        }]
      };

    } catch (error) {
      console.error('Error in handleDigitalTwinQuery:', error);
      return {
        content: [{
          type: 'text',
          text: 'Sorry, I encountered an error while processing your question. Please try again.'
        }]
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Cristina Digital Twin MCP server running on stdio');
  }
}

const server = new DigitalTwinMCPServer();
server.run().catch(console.error);