// Test if server is responding at all
const testServer = async () => {
  try {
    console.log('Testing homepage...');
    const response = await fetch('http://localhost:3000/');
    console.log('Homepage status:', response.status);
    
    if (response.ok) {
      console.log('Homepage is working');
    } else {
      console.log('Homepage error');
    }
  } catch (error) {
    console.error('Server not responding:', error.message);
  }
};

testServer();