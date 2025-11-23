// Direct test of RAG functionality without Next.js
// Run with: node test-rag-direct.js

import Groq from 'groq-sdk';
import { Index } from '@upstash/vector';
import fs from 'fs';
import path from 'path';

// Load environment variables
const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim().replace(/^"/, '').replace(/"$/, '');
    if (key && value) {
      process.env[key.trim()] = value;
    }
  }
});

console.log('Environment variables loaded:');
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Set' : 'Missing');
console.log('UPSTASH_VECTOR_REST_URL:', process.env.UPSTASH_VECTOR_REST_URL ? 'Set' : 'Missing');
console.log('UPSTASH_VECTOR_REST_TOKEN:', process.env.UPSTASH_VECTOR_REST_TOKEN ? 'Set' : 'Missing');

// Initialize clients
const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

// Load profile data
function loadProfileData() {
  const profilePath = path.join('..', 'data', 'digitaltwin.json');
  const data = fs.readFileSync(profilePath, 'utf8');
  return JSON.parse(data);
}

// Fallback search function
function fallbackSearch(question, profileData) {
  const lowerQuestion = question.toLowerCase();
  
  // Search categories
  const categories = {
    experience: ['work', 'job', 'company', 'freelance', 'employment'],
    skills: ['skill', 'technical', 'programming', 'technology', 'language', 'framework'],
    projects: ['project', 'portfolio', 'built', 'developed', 'created'],
    career: ['goal', 'future', 'learning', 'plan'],
    education: ['university', 'degree', 'school', 'education']
  };
  
  const results = [];
  
  // Check which category matches
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
      if (category === 'experience' && profileData.experience) {
        results.push(`Professional Experience: ${JSON.stringify(profileData.experience, null, 2)}`);
      }
      if (category === 'skills' && profileData.skills) {
        results.push(`Technical Skills: ${JSON.stringify(profileData.skills, null, 2)}`);
      }
      if (category === 'projects' && profileData.projects_portfolio) {
        results.push(`Projects Portfolio: ${JSON.stringify(profileData.projects_portfolio, null, 2)}`);
      }
      if (category === 'career' && profileData.career_goals) {
        results.push(`Career Goals: ${JSON.stringify(profileData.career_goals, null, 2)}`);
      }
      if (category === 'education' && profileData.education) {
        results.push(`Education: ${JSON.stringify(profileData.education, null, 2)}`);
      }
    }
  }
  
  // If no specific category, return personal info
  if (results.length === 0 && profileData.personal) {
    results.push(`Personal Summary: ${JSON.stringify(profileData.personal, null, 2)}`);
  }
  
  return results;
}

// Generate response with Groq
async function generateResponse(context, question) {
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

  const completion = await groqClient.chat.completions.create({
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

// Main test function
async function testRAG() {
  console.log('🚀 Testing Cristina\'s Digital Twin RAG System (Direct Mode)...\n');
  
  try {
    // Load profile data
    const profileData = loadProfileData();
    console.log('✅ Profile data loaded successfully');
    
    const testQuestions = [
      "What are your technical skills with Laravel?",
      "Tell me about your freelance experience",
      "What projects have you built?",
      "What are your career goals?",
      "Do you have experience with CodeIgniter?" // This should NOT return false info
    ];
    
    for (const question of testQuestions) {
      console.log(`\n❓ Question: "${question}"`);
      
      try {
        // Try vector search first
        console.log('🔍 Trying vector search...');
        let mode = 'fallback';
        let context = '';
        
        try {
          const vectorResults = await vectorIndex.query({
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
            console.log(`✅ Vector search found ${vectorResults.length} results`);
          } else {
            throw new Error('No vector results');
          }
        } catch {
          console.log('📋 Vector search failed, using fallback search...');
          const fallbackResults = fallbackSearch(question, profileData);
          context = fallbackResults.join('\n\n');
        }
        
        // Generate response
        console.log('⚡ Generating response...');
        const response = await generateResponse(context, question);
        console.log(`✅ Response (${mode}): ${response}`);
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Failed to load profile data: ${error.message}`);
  }
}

testRAG().catch(console.error);