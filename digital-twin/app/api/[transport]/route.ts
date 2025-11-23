// app/api/[transport]/route.ts
// Basic MCP server implementation without mcp-handler for Vercel deployment
import { NextRequest, NextResponse } from 'next/server';
import { queryDigitalTwin } from '@/lib/digital-twin';

export async function GET() {
  return NextResponse.json({ 
    message: 'Cristina Digital Twin MCP Server',
    status: 'running',
    endpoint: '/api/mcp'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Basic JSON-RPC 2.0 MCP protocol handling
    if (body.method === 'initialize') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'cristina-digital-twin',
            version: '1.0.0'
          }
        }
      });
    }
    
    if (body.method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          tools: [
            {
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
            }
          ]
        }
      });
    }
    
    if (body.method === 'tools/call') {
      const { name, arguments: args } = body.params;
      
      if (name === 'digital-twin-query') {
        const { question } = args;
        console.log('[MCP Tool] Digital twin query received:', question);
        
        try {
          const result = await queryDigitalTwin(question);
          console.log('[MCP Tool] Digital twin response generated');
          
          return NextResponse.json({
            jsonrpc: '2.0',
            id: body.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: typeof result === 'string' ? result : JSON.stringify(result)
                }
              ]
            }
          });
        } catch (error) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id: body.id,
            error: {
              code: -32603,
              message: 'Internal error',
              data: error instanceof Error ? error.message : 'Unknown error'
            }
          });
        }
      }
      
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id,
        error: {
          code: -32601,
          message: 'Method not found',
          data: `Unknown tool: ${name}`
        }
      });
    }
    
    return NextResponse.json({
      jsonrpc: '2.0',
      id: body.id,
      error: {
        code: -32601,
        message: 'Method not found'
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error',
        data: error instanceof Error ? error.message : 'Invalid JSON'
      }
    });
  }
}