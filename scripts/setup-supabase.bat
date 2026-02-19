@echo off
echo ========================================
echo    Service Engineer Planner - Supabase Setup
echo ========================================
echo.

echo Step 1: Create .env file with your Supabase credentials
echo.
echo Please follow these steps:
echo 1. Go to https://supabase.com
echo 2. Create a new project
echo 3. Go to Settings ^> API
echo 4. Copy your Project URL and Anon Key
echo 5. Create a .env file in this directory with:
echo.
echo REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
echo REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
echo.
echo 6. Run the SQL schema from src/database/schema.sql in your Supabase SQL Editor
echo.
echo Press any key to continue after setting up Supabase...
pause

echo.
echo Step 2: Installing dependencies...
call npm install

echo.
echo Step 3: Starting the application...
echo The app will use Supabase if configured, otherwise localStorage
call npm start

pause

echo Apply the SQL schema to Supabase:
echo 1) Open Supabase Dashboard > SQL Editor
echo 2) Paste contents of src\database\schema.sql and run
echo.
echo To seed users directly in Supabase, prefer Auth > Users or use Admin API.
echo For CLI-based creation with service key, create a Node script using service_role key.