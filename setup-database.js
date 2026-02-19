#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
  console.log('❌ Please configure your Supabase credentials in .env file first');
  console.log('Run: node setup-supabase.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Display schema instructions
async function displaySchemaInstructions() {
  console.log('📋 Database Schema Setup:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('IMPORTANT: You must manually execute the schema in your Supabase SQL Editor.');
  console.log('');
  console.log('Steps:');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the entire contents of src/database/schema.sql');
  console.log('4. Click "Run" to execute the schema');
  console.log('');
  console.log('This creates all tables, policies, and seed data.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Admin user to create
const adminUser = {
  email: 'admin@company.com',
  password: 'admin123',
  name: 'Admin',
  role: 'manager',
  is_admin: true,
  location_id: 1,
  phone: '+91 98765 43215',
  bio: 'System Administrator with full access to all features',
  skills: ['System Administration', 'User Management', 'Data Analysis'],
  certifications: ['System Admin', 'Security+'],
  experience_years: 8,
  avatar: '👑',
  is_available: true,
  is_active: true
};

async function setupDatabase() {
  console.log('🚀 Setting up Service Engineer Planner database...\n');

  try {
    // Display schema instructions
    await displaySchemaInstructions();

    // First, let's check if we can connect to Supabase
    console.log('📡 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('❌ Cannot connect to Supabase. Please check your credentials.');
      console.log('Error:', testError.message);
      return;
    }

    console.log('✅ Connected to Supabase successfully!\n');

    // Create admin user
    console.log('👑 Creating admin user account...');
    console.log('⚠️  Note: Admin user creation requires schema to be executed first.');
    console.log('   If this fails, please run the schema in Supabase SQL Editor first.');
    console.log('');

    try {
      // Sign up the admin user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminUser.email,
        password: adminUser.password,
        options: {
          data: {
            name: adminUser.name,
            role: adminUser.role,
            is_admin: adminUser.is_admin
          }
        }
      });

      if (authError) {
        console.log(`❌ Error creating admin auth:`, authError.message);
        console.log('💡 This may be because the database schema hasn\'t been created yet.');
        console.log('   Please execute src/database/schema.sql in your Supabase SQL Editor first.');
      } else if (authData.user) {
        // Create admin profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role,
            is_admin: adminUser.is_admin,
            location_id: adminUser.location_id,
            phone: adminUser.phone,
            bio: adminUser.bio,
            skills: adminUser.skills,
            certifications: adminUser.certifications,
            experience_years: adminUser.experience_years,
            avatar: adminUser.avatar,
            is_available: adminUser.is_available,
            is_active: adminUser.is_active
          });

        if (profileError) {
          console.log(`❌ Error creating admin profile:`, profileError.message);
          console.log('💡 This may be because the database schema hasn\'t been created yet.');
        } else {
          console.log(`✅ Created admin user: ${adminUser.name}`);
        }
      }
    } catch (error) {
      console.log(`❌ Error creating admin user:`, error.message);
      console.log('💡 Make sure the database schema is created in Supabase first.');
    }

    console.log('\n🎉 Database setup complete!');
    console.log('\n📋 Admin account created:');
    console.log(`   Admin: ${adminUser.email} / ${adminUser.password}`);
    console.log('\n💡 Note: You can create additional users through the application\'s signup process.');

  } catch (error) {
    console.log('❌ Setup failed:', error.message);
  }
}

setupDatabase();
