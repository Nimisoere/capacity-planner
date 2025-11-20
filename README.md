# Team Capacity Planner

A simple, powerful tool for planning team capacity across weeks, accounting for holidays, first responder (FR) duty, and project assignments.

## Features

- 📅 **Week-based planning** - Configure working days per week
- 👥 **Team management** - Track multiple people and their availability
- 🏖️ **Holiday tracking** - Account for holidays per person per week
- 🚨 **FR (First Responder) scheduling** - Dedicate capacity for on-call duty
- 📊 **Project assignments** - Assign people to projects with flexible start/end dates
- 📈 **Capacity visualization** - Color-coded metrics showing utilization and availability
- 📝 **Reports** - Detailed per-person breakdowns across all weeks
- 🔗 **Shareable links** - Generate read-only URLs to share schedules
- 💾 **Database persistence** - All data saved to Supabase
- 🔐 **Authentication** - Secure login with Clerk

## Live Demo

Deploy your own instance in minutes!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/capacity-planner)

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- A [Supabase](https://supabase.com) account (free tier works)
- A [Clerk](https://clerk.com) account (free tier works)
- A [Vercel](https://vercel.com) account for deployment (optional)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/capacity-planner.git
cd capacity-planner
npm install
```

### 2. Setup Supabase

1. Create a new project at https://supabase.com
2. Go to **Project Settings** → **API**
3. Copy your `Project URL` and `anon public` key
4. Go to **SQL Editor** and run this schema:

```sql
-- Create schedules table
CREATE TABLE schedules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX idx_schedules_user_id ON schedules(user_id);

-- Enable Row Level Security
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own schedules
CREATE POLICY "Users can view their own schedules"
  ON schedules FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own schedules"
  ON schedules FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own schedules"
  ON schedules FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own schedules"
  ON schedules FOR DELETE
  USING (auth.jwt() ->> 'sub' = user_id);
```

### 3. Setup Clerk

1. Create a new application at https://clerk.com
2. Go to **API Keys**
3. Copy your `Publishable key` and `Secret key`

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 6. Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add the environment variables from `.env.local`
4. Deploy!

## How It Works

### Capacity Calculations

The planner calculates three key metrics per person per week:

1. **Availability** = Working days - Holiday days
2. **Capacity** = Availability - FR days (if on FR duty that week)
3. **Allocated** = Sum of project assignments (capped at availability)

### Project Capacity

Projects show actual vs planned capacity:
- **Planned Capacity**: Sum of all assignment days/week
- **Actual Capacity**: Accounts for holidays and FR duty
- Color-coded percentages:
  - 🟢 Green: ≥90% (full capacity available)
  - 🟡 Yellow: 70-89% (reduced capacity)
  - 🔴 Red: <70% (significantly reduced)

### Per-Person Assignment Dates

Each person can have different start/end dates within a project, reflecting real-world scenarios where team members join/leave at different times.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Clerk
- **Deployment**: Vercel

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this for your team's capacity planning needs!

## Support

If you find this tool useful, please star the repository on GitHub!
