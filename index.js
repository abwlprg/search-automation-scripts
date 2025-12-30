import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Store active clients for SSE
const clients = new Map();

// Middleware to parse JSON
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// SSE endpoint
app.get('/progress', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  const clientId = Date.now();
  clients.set(clientId, res);

  req.on('close', () => {
    clients.delete(clientId);
  });
});

// Function to send progress to all clients
function sendProgress(progress, total, type) {
  clients.forEach((res) => {
    res.write(`data: ${JSON.stringify({ progress, total, type })}\n\n`);
  });
}

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to run Google search
app.post('/run-google', (req, res) => {
  const env = {
    ...process.env,
    GOOGLE_API_KEY: 'AIzaSyCK_rv0DW4euOnJjOb-dnMnBWi1naI7B7c',
    SEARCH_ENGINE_ID: '16f02ed784ed24bc6',
    QUERY: 'Leah Scully',
    DOMAIN: 'https://veteranwithacamera.com/leah-scully'
  };

  const child = spawn('node', ['google_api_search.mjs'], {
    env,
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let output = '';
  let errorOutput = '';

  child.stdout.on('data', (data) => {
    const dataStr = data.toString();
    output += dataStr;
    
    // Check for progress updates
    const progressMatch = dataStr.match(/Progress: (\d+)\/(\d+)/);
    if (progressMatch) {
      const current = parseInt(progressMatch[1]);
      const total = parseInt(progressMatch[2]);
      sendProgress(current, total, 'google');
    }
  });

  child.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  child.on('close', (code) => {
    sendProgress(0, 0, 'complete'); // Reset progress
    res.json({
      success: code === 0,
      output: output,
      error: errorOutput,
      code: code
    });
  });
});

// Route to run Behance search
app.post('/run-behance', (req, res) => {
  const env = {
    ...process.env,
    GOOGLE_API_KEY: 'AIzaSyCK_rv0DW4euOnJjOb-dnMnBWi1naI7B7c',
    SEARCH_ENGINE_ID: '16f02ed784ed24bc6',
    QUERY: 'Leah Scully',
    DOMAIN: 'https://www.behance.net/gallery/218277967/Leah-Scully?locale=en_US',
    EXACT_URL: 'true'
  };

  const child = spawn('node', ['google_api_search.mjs'], {
    env,
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let output = '';
  let errorOutput = '';

  child.stdout.on('data', (data) => {
    const dataStr = data.toString();
    output += dataStr;
    
    // Check for progress updates
    const progressMatch = dataStr.match(/Progress: (\d+)\/(\d+)/);
    if (progressMatch) {
      const current = parseInt(progressMatch[1]);
      const total = parseInt(progressMatch[2]);
      sendProgress(current, total, 'behance');
    }
  });

  child.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  child.on('close', (code) => {
    sendProgress(0, 0, 'complete'); // Reset progress
    res.json({
      success: code === 0,
      output: output,
      error: errorOutput,
      code: code
    });
  });
});

// Route to run Bing search for Adobe Portfolio
app.post('/run-bing-portfolio', (req, res) => {
  // Note: You'll need to set BING_SUBSCRIPTION_KEY in your environment
  const env = {
    ...process.env,
    QUERY: 'Leah Scully',
    DOMAIN: 'https://veteranwithacamera.com/leah-scully'
    // Add BING_SUBSCRIPTION_KEY if available
  };

  const child = spawn('node', ['bing_api_search.mjs'], {
    env,
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let output = '';
  let errorOutput = '';

  child.stdout.on('data', (data) => {
    const dataStr = data.toString();
    output += dataStr;
    
    // Check for progress updates
    const progressMatch = dataStr.match(/Progress: (\d+)\/(\d+)/);
    if (progressMatch) {
      const current = parseInt(progressMatch[1]);
      const total = parseInt(progressMatch[2]);
      sendProgress(current, total, 'bing-portfolio');
    }
  });

  child.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  child.on('close', (code) => {
    sendProgress(0, 0, 'complete'); // Reset progress
    res.json({
      success: code === 0,
      output: output,
      error: errorOutput,
      code: code
    });
  });
});

// Route to run Bing search for Behance
app.post('/run-bing-behance', (req, res) => {
  // Note: You'll need to set BING_SUBSCRIPTION_KEY in your environment
  const env = {
    ...process.env,
    QUERY: 'Leah Scully',
    DOMAIN: 'https://www.behance.net/gallery/218277967/Leah-Scully'
    // Add BING_SUBSCRIPTION_KEY if available
  };

  const child = spawn('node', ['bing_api_search.mjs'], {
    env,
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let output = '';
  let errorOutput = '';

  child.stdout.on('data', (data) => {
    const dataStr = data.toString();
    output += dataStr;
    
    // Check for progress updates
    const progressMatch = dataStr.match(/Progress: (\d+)\/(\d+)/);
    if (progressMatch) {
      const current = parseInt(progressMatch[1]);
      const total = parseInt(progressMatch[2]);
      sendProgress(current, total, 'bing-behance');
    }
  });

  child.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  child.on('close', (code) => {
    sendProgress(0, 0, 'complete'); // Reset progress
    res.json({
      success: code === 0,
      output: output,
      error: errorOutput,
      code: code
    });
  });
});

// Route to run Bing search for Adobe Portfolio
app.post('/run-bing-portfolio', (req, res) => {
  // Note: You'll need to set BING_SUBSCRIPTION_KEY in your environment
  const env = {
    ...process.env,
    QUERY: 'Leah Scully',
    DOMAIN: 'https://veteranwithacamera.com/leah-scully'
    // Add BING_SUBSCRIPTION_KEY if available
  };

  const child = spawn('node', ['bing_api_search.mjs'], {
    env,
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let output = '';
  let errorOutput = '';

  child.stdout.on('data', (data) => {
    const dataStr = data.toString();
    output += dataStr;
    
    // Check for progress updates
    const progressMatch = dataStr.match(/Progress: (\d+)\/(\d+)/);
    if (progressMatch) {
      const current = parseInt(progressMatch[1]);
      const total = parseInt(progressMatch[2]);
      sendProgress(current, total, 'bing-portfolio');
    }
  });

  child.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  child.on('close', (code) => {
    sendProgress(0, 0, 'complete'); // Reset progress
    res.json({
      success: code === 0,
      output: output,
      error: errorOutput,
      code: code
    });
  });
});

// Route to run Bing search for Behance
app.post('/run-bing-behance', (req, res) => {
  // Note: You'll need to set BING_SUBSCRIPTION_KEY in your environment
  const env = {
    ...process.env,
    QUERY: 'Leah Scully',
    DOMAIN: 'https://www.behance.net/gallery/218277967/Leah-Scully'
    // Add BING_SUBSCRIPTION_KEY if available
  };

  const child = spawn('node', ['bing_api_search.mjs'], {
    env,
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let output = '';
  let errorOutput = '';

  child.stdout.on('data', (data) => {
    const dataStr = data.toString();
    output += dataStr;
    
    // Check for progress updates
    const progressMatch = dataStr.match(/Progress: (\d+)\/(\d+)/);
    if (progressMatch) {
      const current = parseInt(progressMatch[1]);
      const total = parseInt(progressMatch[2]);
      sendProgress(current, total, 'bing-behance');
    }
  });

  child.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  child.on('close', (code) => {
    sendProgress(0, 0, 'complete'); // Reset progress
    res.json({
      success: code === 0,
      output: output,
      error: errorOutput,
      code: code
    });
  });
});

app.listen(port, () => {
  console.log(`Tester app listening at http://localhost:${port}`);
});