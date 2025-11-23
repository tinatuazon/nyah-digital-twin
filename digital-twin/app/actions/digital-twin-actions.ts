// app/actions/digital-twin-actions.ts
// Server actions for digital twin functionality
'use server';

import { ragQuery } from '@/lib/rag-query';
import type { RAGQueryResult } from '@/lib/types';

export interface DigitalTwinActionResult {
  success: boolean;
  response: string;
  error?: string;
  metadata?: {
    originalQuery: string;
    resultsFound?: number;
    processingTime?: number;
  };
}

/**
 * Enhanced digital twin query action that uses the comprehensive RAG system
 */
export async function enhancedDigitalTwinQuery(question: string): Promise<DigitalTwinActionResult> {
  const startTime = Date.now();
  
  try {
    console.log('[Action] Digital twin query:', question);
    
    // Validate input
    if (!question || question.trim().length === 0) {
      return {
        success: false,
        response: 'Please provide a valid question.',
        error: 'Empty question provided'
      };
    }
    
    // Use the enhanced RAG query system
    const ragResult: RAGQueryResult = await ragQuery(question);
    
    if (!ragResult.success) {
      console.error('[Action] RAG query failed:', ragResult.error);
      return {
        success: false,
        response: 'I apologize, but I encountered an issue processing your question. Please try again.',
        error: ragResult.error?.message || ragResult.error?.code || 'Unknown error'
      };
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: true,
      response: ragResult.response,
      metadata: {
        originalQuery: question,
        resultsFound: ragResult.metrics?.resultsCount || 0,
        processingTime
      }
    };
    
  } catch (error) {
    console.error('[Action] Digital twin query error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      response: 'I apologize, but I encountered an unexpected error. Please try rephrasing your question.',
      error: errorMessage
    };
  }
}

/**
 * Basic digital twin query action (fallback without enhancements)
 */
export async function basicDigitalTwinQuery(question: string): Promise<DigitalTwinActionResult> {
  const startTime = Date.now();
  
  try {
    console.log('[Action] Basic digital twin query:', question);
    
    // Use basic RAG query without enhancements
    const ragResult: RAGQueryResult = await ragQuery(question);
    
    if (!ragResult.success) {
      return {
        success: false,
        response: 'Unable to process your question at this time.',
        error: ragResult.error?.message || ragResult.error?.code || 'Unknown error'
      };
    }
    
    return {
      success: true,
      response: ragResult.response,
      metadata: {
        originalQuery: question,
        resultsFound: ragResult.metrics?.resultsCount || 0,
        processingTime: Date.now() - startTime
      }
    };
    
  } catch (error) {
    console.error('[Action] Basic digital twin query error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      response: 'Sorry, I cannot answer that question right now.',
      error: errorMessage
    };
  }
}