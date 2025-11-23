'use server';

import { ragQuery } from './rag-query';
import { setupVectorDatabase } from './vector-setup';
import { fallbackSearch } from './fallback-search';
import { loadProfileData } from './profile-loader';

// Main RAG search function - matches agents.md specification
export async function ragQueryAction(question: string) {
  return await ragQuery(question);
}

// Initialize and populate vector DB - matches agents.md specification  
export async function setupVectorDatabaseAction() {
  return await setupVectorDatabase();
}

// Keyword-based search when vector DB unavailable - matches agents.md specification
export async function fallbackSearchAction(question: string) {
  return await fallbackSearch(question);
}

// Load data from JSON file - matches agents.md specification
export async function loadProfileDataAction() {
  return await loadProfileData();
}

// MCP Server Tool: Digital Twin Query - Following MCP specification
export async function handleDigitalTwinQuery(question: string) {
  // Validate input according to MCP protocol
  if (!question || question.trim() === '') {
    return {
      content: [{
        type: 'text',
        text: 'Please provide a question about my professional profile.'
      }],
      isError: false
    };
  }

  try {
    const result = await ragQuery(question.trim());
    
    if (!result.success) {
      return {
        content: [{
          type: 'text', 
          text: result.response
        }],
        isError: true
      };
    }

    // Format response with mode indicator following MCP specification
    const modeIndicator = result.mode === 'vector' ? '🔍' : '📋';
    const responseText = `${modeIndicator} ${result.response}`;
    
    // Proper MCP response format
    return {
      content: [{
        type: 'text',
        text: responseText
      }],
      isError: false
    };
    
  } catch (error) {
    console.error('MCP Tool Error:', error);
    return {
      content: [{
        type: 'text',
        text: 'Sorry, I encountered an error while processing your question. Please try again.'
      }],
      isError: true
    };
  }
}