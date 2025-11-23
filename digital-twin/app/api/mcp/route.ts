// app/api/mcp/route.ts
// Working MCP server using @modelcontextprotocol/sdk with digital twin tool

import { enhancedDigitalTwinQuery } from '@/app/actions/digital-twin-actions';

export async function GET(request: Request) {
  console.log('[MCP] GET request received');
  return Response.json({ 
    status: 'Cristina Digital Twin MCP Server Running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    tools: ['digital-twin-query']
  });
}

export async function POST(request: Request) {
  console.log('[MCP] POST request received');
  
  try {
    const body = await request.json();
    const { method, params, id } = body;
    
    console.log('[MCP] Method:', method, 'ID:', id);
    
    if (method === 'initialize') {
      console.log('[MCP] Handling initialize...');
      const response = {
        jsonrpc: '2.0',
        id: id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {
              listChanged: false
            }
          },
          serverInfo: {
            name: 'cristina-digital-twin',
            version: '1.0.0'
          }
        }
      };
      console.log('[MCP] Sending initialize response');
      return Response.json(response);
    }
    
    if (method === 'tools/list') {
      console.log('[MCP] Handling tools/list...');
      const response = {
        jsonrpc: '2.0',
        id: id,
        result: {
          tools: [{
            name: 'digital-twin-query',
            description: 'Query Cristina Tuazon\'s professional digital twin to get answers about her background, skills, experience, and career goals for interview preparation',
            inputSchema: {
              type: 'object',
              properties: {
                question: {
                  type: 'string',
                  description: 'The question about the digital twin professional profile'
                }
              },
              required: ['question']
            }
          }]
        }
      };
      console.log('[MCP] Sending tools list response');
      return Response.json(response);
    }
    
    if (method === 'tools/call') {
      console.log('[MCP] Handling tools/call...', params);
      
      if (params?.name === 'digital-twin-query') {
        const question = params?.arguments?.question;
        
        if (!question) {
          return Response.json({
            jsonrpc: '2.0',
            id: id,
            error: {
              code: -32602,
              message: 'Invalid parameters: question is required'
            }
          });
        }
        
        console.log('[MCP] Processing digital twin query:', question);
        
        // Use the enhanced digital twin query
        const result = await enhancedDigitalTwinQuery(question);
        
        if (!result.success) {
          return Response.json({
            jsonrpc: '2.0',
            id: id,
            result: {
              content: [{
                type: 'text',
                text: result.response || 'I apologize, but I encountered an error processing your question.'
              }],
              isError: true
            }
          });
        }
        
        const response = {
          jsonrpc: '2.0',
          id: id,
          result: {
            content: [{
              type: 'text',
              text: result.response
            }],
            isError: false
          }
        };
        
        console.log('[MCP] Sending digital twin response');
        return Response.json(response);
      }
      
      return Response.json({
        jsonrpc: '2.0',
        id: id,
        error: {
          code: -32601,
          message: `Unknown tool: ${params?.name}`
        }
      });
    }
    
    console.log('[MCP] Unhandled method:', method);
    return Response.json({
      jsonrpc: '2.0',
      id: id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`
      }
    });
    
  } catch (error) {
    console.error('[MCP] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return Response.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: 'Internal server error: ' + errorMessage
      }
    }, { status: 500 });
  }
}