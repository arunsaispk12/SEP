#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

console.log('🚀 Complete Supabase Setup for Service Engineer Planner\n');

// Check if .env file exists and has proper values
function checkEnvironment() {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  console.log('📋 Checking environment configuration...');
  console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('Supabase Key:', supabaseKey ? '✅ Set' : '❌ Missing');

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
    console.log('\n❌ Environment not configured properly!');
    console.log('\n📝 Please follow these steps:');
    console.log('1. Go to https://supabase.com and create a new project');
    console.log('2. Go to Settings → API in your Supabase dashboard');
    console.log('3. Copy your Project URL and Anon Key');
    console.log('4. Update your .env file with these values:');
    console.log('   REACT_APP_SUPABASE_URL=https://your-actual-project-id.supabase.co');
    console.log('   REACT_APP_SUPABASE_ANON_KEY=your-actual-anon-key');
    console.log('\n5. Then run this script again: npm run setup-complete');
    return false;
  }

  return true;
}

// Test Supabase connection
async function testConnection() {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\n📡 Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('locations')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Connection failed:', error.message);
      
      if (error.message.includes('locations')) {
        console.log('\n💡 The database schema needs to be set up.');
        console.log('Please run the SQL schema in your Supabase dashboard:');
        console.log('\n1. Go to your Supabase dashboard');
        console.log('2. Click on "SQL Editor"');
        console.log('3. Copy the content from src/database/schema-simple.sql');
        console.log('4. Paste it in the SQL Editor');
        console.log('5. Click "Run" to execute');
        console.log('6. Then run this script again: npm run setup-complete');
        return false;
      }
      return false;
    }

    console.log('✅ Successfully connected to Supabase!');
    return true;
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    return false;
  }
}

// Create users in Supabase
async function createUsers() {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\n👥 Creating user accounts...');

  const demoUsers = [
    {
      email: 'kavin@company.com',
      password: 'kavin123',
      name: 'Kavin',
      role: 'engineer',
      location_id: 1,
      phone: '+91 98765 43210',
      bio: 'Senior Field Engineer with 5+ years experience',
      skills: ['Hardware Repair', 'Network Setup', 'System Maintenance'],
      certifications: ['CCNA', 'CompTIA A+'],
      experience_years: 5,
      avatar: '👨‍🔧',
      is_available: true,
      is_active: true
    },
    {
      email: 'arun@company.com',
      password: 'arun123',
      name: 'Arun',
      role: 'engineer',
      location_id: 2,
      phone: '+91 98765 43211',
      bio: 'Software Specialist with expertise in enterprise systems',
      skills: ['Software Installation', 'Database Management', 'Cloud Services'],
      certifications: ['AWS Certified', 'Microsoft Azure'],
      experience_years: 4,
      avatar: '👨‍💻',
      is_available: true,
      is_active: true
    },
    {
      email: 'gokul@company.com',
      password: 'gokul123',
      name: 'Gokul',
      role: 'engineer',
      location_id: 3,
      phone: '+91 98765 43212',
      bio: 'Technical Expert specializing in complex installations',
      skills: ['Technical Analysis', 'Problem Solving', 'Equipment Setup'],
      certifications: ['PMP', 'ITIL Foundation'],
      experience_years: 6,
      avatar: '👨‍🔬',
      is_available: true,
      is_active: true
    },
    {
      email: 'kathir@company.com',
      password: 'kathir123',
      name: 'Kathir',
      role: 'engineer',
      location_id: 4,
      phone: '+91 98765 43213',
      bio: 'Industrial Systems Specialist with manufacturing expertise',
      skills: ['Industrial Systems', 'Manufacturing Equipment', 'Safety Protocols'],
      certifications: ['OSHA Safety', 'Industrial Automation'],
      experience_years: 7,
      avatar: '👨‍🏭',
      is_available: true,
      is_active: true
    },
    {
      email: 'manager@company.com',
      password: 'manager123',
      name: 'Manager',
      role: 'manager',
      location_id: 1,
      phone: '+91 98765 43214',
      bio: 'Operations Manager overseeing field service operations',
      skills: ['Team Management', 'Operations Planning', 'Strategic Planning'],
      certifications: ['PMP', 'Six Sigma Black Belt'],
      experience_years: 10,
      avatar: '👨‍💼',
      is_available: true,
      is_active: true
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < demoUsers.length; i++) {
    const user = demoUsers[i];
    console.log(`Creating user: ${user.name} (${user.email})`);
    
    // Add delay between user creations to avoid rate limiting
    if (i > 0) {
      console.log('⏳ Waiting 5 seconds to avoid rate limiting...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            name: user.name,
            role: user.role
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`⚠️  User ${user.name} already exists, skipping...`);
          successCount++;
        } else if (authError.message.includes('For security purposes')) {
          console.log(`⏳ Rate limited for ${user.name}, waiting 10 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 10000));
          // Retry once
          const { data: retryData, error: retryError } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
            options: {
              data: {
                name: user.name,
                role: user.role
              }
            }
          });
          
          if (retryError) {
            console.log(`❌ Retry failed for ${user.name}:`, retryError.message);
            errorCount++;
            continue;
          }
          
          if (retryData.user) {
            // Create profile for retry
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: retryData.user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                location_id: user.location_id,
                phone: user.phone,
                bio: user.bio,
                skills: user.skills,
                certifications: user.certifications,
                experience_years: user.experience_years,
                avatar: user.avatar,
                is_available: user.is_available,
                is_active: user.is_active
              });

            if (profileError) {
              console.log(`❌ Error creating profile for ${user.name}:`, profileError.message);
              errorCount++;
            } else {
              console.log(`✅ Created user: ${user.name} (after retry)`);
              successCount++;
            }
          }
        } else {
          console.log(`❌ Error creating auth for ${user.name}:`, authError.message);
          errorCount++;
        }
        continue;
      }

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            location_id: user.location_id,
            phone: user.phone,
            bio: user.bio,
            skills: user.skills,
            certifications: user.certifications,
            experience_years: user.experience_years,
            avatar: user.avatar,
            is_available: user.is_available,
            is_active: user.is_active
          });

        if (profileError) {
          console.log(`❌ Error creating profile for ${user.name}:`, profileError.message);
          errorCount++;
        } else {
          console.log(`✅ Created user: ${user.name}`);
          successCount++;
        }
      }
    } catch (error) {
      console.log(`❌ Error creating ${user.name}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 User creation summary:`);
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`❌ Errors: ${errorCount} users`);
  
  return successCount > 0;
}

// Main setup function
async function main() {
  console.log('🔍 Step 1: Checking environment...');
  if (!checkEnvironment()) {
    process.exit(1);
  }

  console.log('\n🔍 Step 2: Testing connection...');
  if (!(await testConnection())) {
    process.exit(1);
  }

  console.log('\n🔍 Step 3: Creating users...');
  const usersCreated = await createUsers();

  if (usersCreated) {
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 You can now login with these accounts:');
    console.log('   Kavin: kavin@company.com / kavin123');
    console.log('   Arun: arun@company.com / arun123');
    console.log('   Gokul: gokul@company.com / gokul123');
    console.log('   Kathir: kathir@company.com / kathir123');
    console.log('   Manager: manager@company.com / manager123');
    console.log('\n🚀 Start your app with: npm start');
  } else {
    console.log('\n❌ Setup failed. Please check the errors above.');
  }
}

main().catch(console.error);
