// lib/digital-twin.ts
// Shared digital twin logic for both MCP server and web interface
import { z } from 'zod';

// Shared Zod schema for question validation
export const questionSchema = z.string().min(1).describe('The question about the digital twin professional profile');

// Tool schema definition for MCP protocol (object with parameter as key)
export const digitalTwinQuerySchema = {
  question: questionSchema
};

export type DigitalTwinQueryInput = {
  question: string;
};

// Tool definition for MCP server
export const digitalTwinQueryTool = {
  name: 'digital-twin-query',
  description: 'Query Nyah Ostonal\'s digital twin to get answers about background, skills, projects, and interests in AI & Robotics',
  schema: digitalTwinQuerySchema
} as const;

// Response interface
export interface DigitalTwinResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  metadata?: {
    originalQuery: string;
    vectorResults?: number;
    processingTime?: number;
  };
}

// Core digital twin query function - this is used by both MCP server and web interface
export async function queryDigitalTwin(question: string): Promise<DigitalTwinResponse> {
  const startTime = Date.now();
  
  try {
    console.log('[DigitalTwin] Processing question:', question);
    
    // Import the enhanced RAG functionality
    const { enhancedDigitalTwinQuery } = await import('@/app/actions/digital-twin-actions');
    
    // Use the enhanced RAG query
    const result = await enhancedDigitalTwinQuery(question);
    
    const processingTime = Date.now() - startTime;
    
    if (!result.success) {
      throw new Error(result.error || 'Digital twin query failed');
    }
    
    return {
      content: [{
        type: 'text',
        text: result.response
      }],
      metadata: {
        originalQuery: question,
        vectorResults: result.metadata?.resultsFound,
        processingTime
      }
    };
    
  } catch (error) {
    console.error('[DigitalTwin] Query error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      content: [{
        type: 'text',
        text: `I apologize, but I encountered an error while processing your question: ${errorMessage}. Please try rephrasing your question or check if the digital twin services are properly configured.`
      }],
      metadata: {
        originalQuery: question,
        processingTime: Date.now() - startTime
      }
    };
  }
}

// Validation helper
export function validateDigitalTwinInput(input: unknown): DigitalTwinQueryInput {
  // Validate using the shared schema
  const validatedQuestion = questionSchema.parse((input as any)?.question);
  return { question: validatedQuestion };
}