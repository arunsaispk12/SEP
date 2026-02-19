#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔍 Debugging Sign-In Issues\n');

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
  console.log('❌ Supabase not configured properly');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey ? 'Set' : 'Not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSignIn() {
  console.log('📋 Testing sign-in with demo accounts...\n');

  const testUsers = [
    { email: 'kavin@company.com', password: 'kavin123', name: 'Kavin' },
    { email: 'arun@company.com', password: 'arun123', name: 'Arun' },
    { email: 'manager@company.com', password: 'manager123', name: 'Manager' }
  ];

  for (const user of testUsers) {
    console.log(`🧪 Testing sign-in for ${user.name} (${user.email})`);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });

      if (error) {
        console.log(`❌ Sign-in failed: ${error.message}`);
        
        // Check if user exists in profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', user.email)
          .single();

        if (profileError) {
          console.log(`   Profile not found in database`);
        } else {
          console.log(`   Profile exists: ${profile.name} (${profile.role})`);
        }
      } else {
        console.log(`✅ Sign-in successful!`);
        console.log(`   User ID: ${data.user.id}`);
        console.log(`   Email: ${data.user.email}`);
        
        // Sign out for next test
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.log(`❌ Unexpected error: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  // Check what users exist in the database
  console.log('📊 Checking existing users in database...');
  
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('name, email, role, is_active');

    if (profilesError) {
      console.log(`❌ Error fetching profiles: ${profilesError.message}`);
    } else {
      console.log(`✅ Found ${profiles.length} users in database:`);
      profiles.forEach(profile => {
        console.log(`   - ${profile.name} (${profile.email}) - ${profile.role} - Active: ${profile.is_active}`);
      });
    }
  } catch (error) {
    console.log(`❌ Error checking profiles: ${error.message}`);
  }
}

debugSignIn().catch(console.error);
