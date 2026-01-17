# M.A.M.A - Make America Make Again

A distributed manufacturing marketplace connecting clients with skilled makers through AI-powered matching, fair pricing, and quality assurance.

## Tech Stack

- **Frontend**: Next.js 16.1.2 (App Router), React 19.2.3, TypeScript
- **Styling**: TailwindCSS 4
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Authentication**: Google OAuth via Supabase

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Google Cloud Console project (for OAuth)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/ArjunParadkar/M.A.M.A.git
   cd M.A.M.A
   ```

2. **Install dependencies**
   ```bash
   cd apps/web
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API and copy your project URL and anon key
   - Run the migrations:
     ```sql
     -- Run supabase/migrations/001_initial_schema.sql
     -- Run supabase/migrations/002_auth_profile_fields.sql
     ```
   - Or use Supabase CLI: `supabase db push`

4. **Configure Google OAuth**
   - In Supabase Dashboard: Authentication > Providers > Google
   - Enable Google provider
   - In Google Cloud Console:
     - Create OAuth 2.0 credentials
     - Add authorized redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
     - Copy Client ID and Client Secret to Supabase

5. **Configure environment variables**
   ```bash
   cd apps/web
   cp .env.local.example .env.local
   ```
   Edit `.env.local` and add:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Authentication Flow

### For Manufacturers
1. Sign up with Google OAuth
2. Complete multi-step profile:
   - Basic info (name, phone, bio)
   - Location (address, city, state, ZIP)
   - Devices (add manufacturing equipment)
   - Materials and capabilities
3. Redirected to maker dashboard

### For Clients
1. Sign up with Google OAuth
2. Complete profile:
   - Choose company or individual
   - Enter contact and address information
3. Redirected to home page

## Project Structure

```
apps/web/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   │   ├── sign-in/       # Sign in page
│   │   ├── sign-up/       # Sign up page
│   │   ├── complete-profile/  # Profile completion
│   │   └── callback/      # OAuth callback
│   ├── maker/             # Manufacturer dashboard
│   │   ├── dashboard/     # Main dashboard
│   │   └── new-requests/  # New job requests
│   └── page.tsx           # Homepage
├── components/            # React components
│   └── auth/             # Auth-related components
├── lib/                  # Utility functions
│   └── supabase/         # Supabase clients
└── middleware.ts         # Auth middleware

supabase/
├── migrations/           # Database migrations
└── seed.sql             # Seed data (optional)
```

## Features

- **Google OAuth Authentication**: Secure sign-in with Google
- **Role-Based Access**: Separate flows for manufacturers and clients
- **Manufacturer Profile**: Multi-step onboarding with device inventory
- **Client Profile**: Company or individual registration
- **Row Level Security**: Secure database access with RLS policies
- **Protected Routes**: Middleware protects authenticated routes

## Database Schema

- **profiles**: User profiles with role and contact info
- **manufacturers**: Manufacturer-specific data and capabilities
- **manufacturer_devices**: Inventory of manufacturing equipment
- **jobs**: Manufacturing job listings
- **job_recommendations**: AI-powered maker rankings
- **pay_estimates**: Fair pay calculations
- **qc_records**: Quality control records
- **disputes**: Dispute management

## AI Systems

1. **Maker Ranking** (F1): Matches jobs with best manufacturers
2. **Fair Pay Estimator** (F2): Calculates fair compensation
3. **Quality Control** (F3): Automated part verification
4. **Workflow Scheduling** (F4): Optimizes task scheduling

## Security

- Row Level Security (RLS) policies on all tables
- Secure authentication via Supabase Auth
- Protected API routes
- Middleware for route protection
- Environment variables for sensitive data

## Contributing

This is a demo project. Contributions and feedback are welcome!

## License

MIT