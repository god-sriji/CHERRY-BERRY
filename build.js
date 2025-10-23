#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🏗️  Building Cherry Berry...\n');

try {
  // Build frontend
  console.log('📦 Building frontend...');
  execSync('npm run build', { 
    cwd: join(__dirname, 'frontend'),
    stdio: 'inherit'
  });
  
  console.log('\n✅ Build complete!');
  console.log('\n🚀 To start the server:');
  console.log('   cd backend');
  console.log('   node server.js');
  console.log('\n📱 Access your app at: http://localhost:3002');
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
