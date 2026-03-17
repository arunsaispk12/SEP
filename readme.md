Planner - Setup and Operations Guide

This single guide replaces all previous setup docs. Follow it end-to-end to configure, run, and operate the app on Windows.

1) Prerequisites
- Node.js 18+ (LTS recommended)
- Git
- Docker Desktop (only if you plan to run with Docker)

2) Install
- Open PowerShell:
```
cd "D:\Site Workspace\Planner"
npm install
```

3) Environment
- Create `.env` from `env.example` and set:
```
REACT_APP_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
REACT_APP_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```
- Test connectivity:
```
node test-connection.js
```

4) Run (Dev)
```
npm start
```
Open http://localhost:3000

5) Desktop Shortcuts (Windows)
```
powershell -ExecutionPolicy Bypass -File scripts\create-shortcuts.ps1
```
Creates:
- Planner (Dev).lnk → npm start
- Planner (Docker).lnk → docker compose up -d
- Planner (Docker Stop).lnk → docker compose down

6) Run with Docker
```
docker compose up -d
```
Stop:
```
docker compose down
```

7) Project structure
- src/ (React app)
- src/components, src/context, src/services, src/database

Troubleshooting
- Verify `.env` values and internet access to `*.supabase.co`
- Reinstall: delete node_modules, run npm install

## Platform Capabilities

The Service Engineer Planner (SEP) is a comprehensive ERP-lite solution for field service management:

- **Advanced Scheduling:** Integrated calendar views with support for multi-step case lifecycles (Travelling, Reached Centre, Installation, etc.).
- **Workflow Intelligence:** Automated enforcement of business rules, such as preventing multi-city assignments on the same day and highlighting schedule overlaps.
- **Role-Based Access (RBAC):** Distinct workflows for Admins, Managers, Service Engineers, Executives, and Clients.
- **Client & Location ERP:** Dedicated modules for managing IVF Hospitals (Clients) and geographic service hubs (Locations).
- **Clinical Data Capture:** Specialized post-case forms for recording patient counts and embryologist details.

## Recent Technical Updates (March 2026)

- **Approval System:** Implemented a new middleware layer requiring manual Admin/Manager approval for all Service Engineer and Executive signups.
- **Schema Evolution:** Updated `profiles` and `cases` tables to support clinical data, equipment tracking (Laser Details), and approval states.
- **UI Refresh:** Added dedicated management interfaces for geographic locations and client organizations.
- **Security:** Restricted case updates to Admins and the specific Engineer assigned to the task.

## Google Calendar Integration (Interactive)

1. In Google Cloud Console, create OAuth 2.0 Client ID (Web) and enable Calendar API.
2. Add Authorized JavaScript origins: your dev URL (e.g., http://localhost:3000).
3. Add Authorized redirect URIs: http://localhost:3000.
4. Add to .env:
   - REACT_APP_GOOGLE_CLIENT_ID=...
   - REACT_APP_GOOGLE_API_KEY=...
5. Restart dev server.
6. In the app, open Google Calendar section and click "Connect to Google Calendar".

## Supabase Setup and RLS

1. Create project; copy Project URL and anon key to .env.
2. Apply schema: open Supabase SQL Editor, paste contents of `src/database/schema.sql`, run.
3. Seed users using Admin (service role): set `SUPABASE_SERVICE_ROLE_KEY` in .env, then run:
   ```bash
   npm run create-users
   ```
4. Sign in with created users.

## Remove Demo Accounts

- Clear browser localStorage keys `engineerUser` and `demoAuth`.
- After users exist in Supabase, login will use real auth and demo fallback won’t trigger.