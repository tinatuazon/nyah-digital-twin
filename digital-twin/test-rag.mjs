// Simple test file to verify RAG functionality
// Run with: node --loader ts-node/esm test-rag.ts

import { queryProfile } from './lib/server-actions.js';

async function testRAG() {
  console.log('🚀 Testing Cristina\'s Digital Twin RAG System...\n');
  
  const testQuestions = [
    "What are your technical skills with Laravel?",
    "Tell me about your freelance experience",
    "What projects have you built?",
    "What are your career goals?",
    "Do you have experience with CodeIgniter?" // This should NOT return false info
  ];
  
  for (const question of testQuestions) {
    console.log(`❓ Question: "${question}"`);
    try {
      const result = await queryProfile(question);
      console.log(`✅ Response (${result.mode}): ${result.response}\n`);
    } catch (error) {
      console.log(`❌ Error: ${error}\n`);
    }
  }
}

testRAG().catch(console.error);