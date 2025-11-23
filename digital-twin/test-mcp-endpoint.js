// Simple test script to verify MCP endpoint
const testMCPEndpoint = async () => {
  try {
    console.log('Testing MCP endpoint...');
    
    // Test GET endpoint
    const getResponse = await fetch('http://localhost:3000/api/mcp');
    const getResult = await getResponse.json();
    console.log('GET test:', getResult);
    
    // Test initialize
    const initResponse = await fetch('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {}
      })
    });
    
    const initResult = await initResponse.json();
    console.log('Initialize test:', JSON.stringify(initResult, null, 2));
    
    // Test tools/list
    const toolsResponse = await fetch('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      })
    });
    
    const toolsResult = await toolsResponse.json();
    console.log('Tools list test:', JSON.stringify(toolsResult, null, 2));
    
    console.log('All tests completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testMCPEndpoint();