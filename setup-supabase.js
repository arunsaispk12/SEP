#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Supabase for Service Engineer Planner...\n');

// Create .env file
const envContent = `# Service Engineer Planner - Supabase Configuration
# Replace these values with your actual Supabase credentials

# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Calendar API Configuration (Optional for now)
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_GOOGLE_API_KEY=your-google-api-key

# Application Configuration
REACT_APP_APP_NAME=Service Engineer Planner
REACT_APP_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=production

# Security Configuration
REACT_APP_SESSION_TIMEOUT=86400000
REACT_APP_MAX_LOGIN_ATTEMPTS=5
REACT_APP_LOCKOUT_DURATION=300000

# Feature Flags
REACT_APP_ENABLE_GOOGLE_CALENDAR=false
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_ANALYTICS=false
`;

try {
  fs.writeFileSync('.env', envContent);
  console.log('✅ Created .env file');
} catch (error) {
  console.log('❌ Error creating .env file:', error.message);
}

console.log('\n📋 Next Steps:');
console.log('1. Go to https://supabase.com and create a new project');
console.log('2. Get your Project URL and Anon Key from Settings → API');
console.log('3. Update the .env file with your actual Supabase credentials');
console.log('4. Run: npm run setup-db');
console.log('5. Run: npm start');
console.log('\n🎯 Your Supabase credentials will replace the placeholder values in .env');
