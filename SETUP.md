# Team Planner Setup Guide

## Prerequisites

You'll need accounts for:
- [Clerk](https://dashboard.clerk.com) - Authentication
- [Supabase](https://app.supabase.com) - PostgreSQL Database

## Step 1: Set up Clerk Authentication

1. Go to https://dashboard.clerk.com
2. Create a new application
3. Copy your API keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

## Step 2: Set up Supabase Database

1. Go to https://app.supabase.com
2. Create a new project
3. Wait for the database to provision
4. Go to Settings > Database
5. Copy the "Connection string" under "URI"
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres`

## Step 3: Configure Environment Variables

1. Create a `.env.local` file in the project root:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
```

## Step 4: Push Database Schema

Run the following command to create the database tables:

```bash
npx prisma db push
```

## Step 5: Generate Prisma Client

```bash
npx prisma generate
```

## Step 6: Start the Development Server

```bash
npm run dev
```

Your Team Planner app should now be running at http://localhost:3000

## Features Implemented

✅ Clerk Authentication
✅ Prisma + Supabase Database
✅ API Routes for CRUD operations
✅ Multiple schedules support

## Still To Do

- [ ] Migrate from localStorage to database calls in the frontend
- [ ] Add comments feature to projects
- [ ] Replace "Week 1" with date ranges throughout UI
- [ ] Improve visual styling
- [ ] Add loading states and error handling

Once you've completed the setup steps above, let me know and I'll continue with the frontend migration!
