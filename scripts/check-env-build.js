#!/usr/bin/env node

// Script to check if environment variables are properly built into the application
import { readFileSync } from 'fs';
import { glob } from 'glob';

console.log('🔍 Checking if environment variables are built into the application...\n');

try {
  // Find built JavaScript files
  const jsFiles = glob.sync('build/_app/immutable/**/*.js');
  
  if (jsFiles.length === 0) {
    console.log('❌ No built JavaScript files found. Run npm run build first.');
    process.exit(1);
  }

  const envVars = [
    'VITE_SOLACE_URL',
    'VITE_SOLACE_VPN_NAME', 
    'VITE_SOLACE_USERNAME',
    'VITE_SOLACE_PASSWORD',
    'VITE_SOLACE_TOPIC'
  ];

  let foundVars = {};
  
  // Search for environment variables in built files
  for (const file of jsFiles.slice(0, 10)) { // Check first 10 files
    try {
      const content = readFileSync(file, 'utf8');
      
      for (const envVar of envVars) {
        if (content.includes(envVar) && !foundVars[envVar]) {
          foundVars[envVar] = file;
        }
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }

  console.log('📊 Environment Variable Build Status:');
  for (const envVar of envVars) {
    if (foundVars[envVar]) {
      console.log(`✅ ${envVar}: Found in build`);
    } else {
      console.log(`❌ ${envVar}: NOT found in build`);
    }
  }

  const foundCount = Object.keys(foundVars).length;
  console.log(`\n📈 Summary: ${foundCount}/${envVars.length} environment variables found in build`);
  
  if (foundCount === 0) {
    console.log('\n⚠️  No environment variables found in build. This means:');
    console.log('   1. Environment variables are not being set during build');
    console.log('   2. The app will use fallback values from getSolaceConfig()');
    console.log('   3. Check GitHub Actions workflow environment variables');
  }

} catch (error) {
  console.error('❌ Error checking build:', error.message);
  process.exit(1);
}