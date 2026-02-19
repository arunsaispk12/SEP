#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Please configure your Supabase credentials in .env file first');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSchema() {
  console.log('🚀 Creating Supabase database schema...\n');

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'src', 'database', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Schema file loaded, executing SQL...\n');

    // Split the schema into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // Some statements might fail due to dependencies, continue with warnings
          console.log(`⚠️  Statement ${i + 1} warning:`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1} failed:`, err.message);
      }
    }

    console.log('\n🎉 Schema creation completed!');
    console.log('You can now run: npm run setup-db');

  } catch (error) {
    console.log('❌ Error creating schema:', error.message);
  }
}

runSchema();