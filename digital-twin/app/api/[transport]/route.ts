// app/api/[transport]/route.ts
// Proper MCP server implementation using mcp-handler following the workshop pattern
import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import { queryDigitalTwin } from '@/lib/digital-twin';

// Define the schema directly here to match the expected format
const questionSchema = z.string().min(1).describe('The question about the digital twin professional profile');

const handler = createMcpHandler(
  (server) => {
    server.tool(
      'digital-twin-query',
      'Query Cristina Tuazon\'s professional digital twin to get answers about her background, skills, experience, and career goals for interview preparation',
      {
        question: questionSchema,
      } as any, // Type assertion to bypass the type issue
      async ({ question }) => {
        console.log('[MCP Tool] Digital twin query received:', question);
        
        // Use the shared digital twin query logic
        const result = await queryDigitalTwin(question);
        
        console.log('[MCP Tool] Digital twin response generated');
        return result;
      }
    );
  },
  {
    // Server options
    name: 'cristina-digital-twin',
    version: '1.0.0'
  },
  {
    // Handler configuration
    basePath: '/api', // This needs to match where the [transport] is located
    maxDuration: 60,
    verboseLogs: true,
  }
);

export { handler as GET, handler as POST };