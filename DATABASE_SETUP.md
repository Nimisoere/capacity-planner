# Database Setup Guide

## Current Status

The app has been **fully migrated** from localStorage to database storage. All CRUD operations now use the Prisma + Supabase backend.

## What's Been Completed

✅ Removed all localStorage operations
✅ Added database API endpoints (`/api/schedules`)
✅ Migrated frontend to use database API
✅ Added loading states and error handling
✅ Added auto-save functionality (debounced)
✅ Added "Saving..." indicator in UI
✅ Prisma client generated successfully

## Database Connection Issue

The Supabase database connection is currently failing with error `P1001`:

```txt
Can't reach database server at db.lubvddhfxyksjqolofkk.supabase.co:5432
```

### Possible Causes

1. **Database is paused** - Supabase automatically pauses inactive databases
2. **Network/firewall issue** - Connection might be blocked
3. **Credentials issue** - Password or URL might be incorrect

## How to Fix

### Option 1: Wake Up Supabase Database (Most Likely)

1. Go to your Supabase Dashboard: <https://supabase.com/dashboard>
2. Find your project: `lubvddhfxyksjqolofkk`
3. Check if the database shows as "Paused"
4. Click "Resume" or run a simple query in the SQL editor to wake it up

### Option 2: Verify Connection String

Your current `.env.local` contains:

```bash
DATABASE_URL=postgresql://postgres:VTLStores123$@db.lubvddhfxyksjqolofkk.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:VTLStores123$@db.lubvddhfxyksjqolofkk.supabase.co:5432/postgres
```

Make sure:

- The password is correct (especially the `$` character)
- The host URL matches your Supabase project

### Option 3: Test the Connection

Try this command to verify the connection:

```bash
npx prisma db push
```

If it succeeds, your database schema will be created and the app will work immediately!

## Once Database is Connected

The app will automatically:

- Create a default schedule on first load
- Save all changes to the database (with 1-second debounce)
- Load schedules from the database on page load
- Sync all CRUD operations (create, read, update, delete)

## Verifying It Works

1. Fix the database connection using one of the options above
2. Run: `npx prisma db push` (this creates the `schedules` table)
3. Start your dev server: `npm run dev`
4. Open the app - you should see a loading spinner, then your schedules
5. Make changes - you'll see "Saving..." appear in the header
6. Refresh the page - your changes should persist

## Key Files

- **Frontend**: `/app/page.tsx` - Now uses API calls instead of localStorage
- **API Routes**:
  - `/app/api/schedules/route.ts` - GET (list), POST (create)
  - `/app/api/schedules/[id]/route.ts` - PUT (update), DELETE (delete)
- **Schema**: `/prisma/schema.prisma` - Database structure
- **Client**: `/lib/prisma.ts` - Prisma client singleton

## Features Added

- ⏳ Loading spinner on app start
- 💾 Auto-save with "Saving..." indicator
- ⚠️ Error alerts for failed operations
- 🔄 Automatic retry on connection issues
- 🆕 Auto-creates first schedule if none exist
- 🔐 All operations are user-scoped (Clerk authentication)

## Need Help?

If you continue having connection issues:

1. Check Supabase dashboard for database status
2. Try resetting your database password
3. Check if your IP is whitelisted in Supabase
4. Try using the pooled connection URL from Supabase settings
