// Test the MCP endpoint with proper JSON-RPC format
const testMCP = async () => {
  try {
    console.log('Testing MCP endpoint...');
    
    const response = await fetch('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' }
        }
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const result = await response.json();
    console.log('Response body:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Error details:', error.message);
  }
};

testMCP();