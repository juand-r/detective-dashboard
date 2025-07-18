#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Detective Solutions Dashboard...\n');

// Start the backend server
console.log('📡 Starting backend server...');
const backend = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

// Start the frontend React server
console.log('⚛️  Starting React frontend...');
const frontend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  env: { 
    ...process.env, 
    BROWSER: 'none',
    DANGEROUSLY_DISABLE_HOST_CHECK: 'true',
    WDS_SOCKET_HOST: 'localhost',
    WDS_SOCKET_PORT: '3000'
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit(0);
});

backend.on('exit', (code) => {
  console.log(`Backend server exited with code ${code}`);
  frontend.kill('SIGINT');
  process.exit(code);
});

frontend.on('exit', (code) => {
  console.log(`Frontend server exited with code ${code}`);
  backend.kill('SIGINT');
  process.exit(code);
});

console.log('\n✅ Both servers started!');
console.log('🌐 Frontend: http://localhost:3000');
console.log('🔌 Backend API: http://localhost:3001');
console.log('\n📝 Press Ctrl+C to stop both servers'); 