# Authentication Setup Guide

## What's Been Implemented

✅ **Complete authentication system with Google OAuth**
- Supabase authentication integration
- Google OAuth provider setup
- Secure session management
- Route protection via middleware

✅ **Manufacturer sign-up flow**
- Google OAuth sign-up
- Multi-step profile completion:
  1. Basic info (name, phone, bio)
  2. Location (address, city, state, ZIP)
  3. Devices (add manufacturing equipment with models)
  4. Materials and capabilities (tolerance tier)

✅ **Client sign-up flow**
- Google OAuth sign-up
- Company vs Individual selection
- Profile completion with contact and address information

✅ **Database schema updates**
- New `manufacturer_devices` table for equipment inventory
- Additional profile fields (client_type, company_name, phone, address, etc.)
- Automatic profile creation trigger on user sign-up
- Row Level Security (RLS) policies for all tables

✅ **Security features**
- Protected routes (middleware redirects unauthenticated users)
- RLS policies ensuring users can only access their own data
- Secure environment variable configuration
- OAuth callback handling

## Setup Steps

### 1. Supabase Configuration

1. **Create a Supabase project** at https://supabase.com
2. **Get your credentials:**
   - Go to Settings > API
   - Copy `Project URL` and `anon public` key
   - Add to `.env.local`:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     ```

3. **Run database migrations:**
   - Go to SQL Editor in Supabase Dashboard
   - Run `supabase/migrations/001_initial_schema.sql`
   - Run `supabase/migrations/002_auth_profile_fields.sql`

### 2. Google OAuth Setup

1. **Google Cloud Console:**
   - Go to https://console.cloud.google.com
   - Create a new project (or use existing)
   - Enable Google+ API
   - Go to "Credentials" > "Create Credentials" > "OAuth client ID"
   - Application type: Web application
   - Authorized redirect URIs:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
   - Copy the Client ID and Client Secret

2. **Supabase Dashboard:**
   - Go to Authentication > Providers > Google
   - Enable Google provider
   - Paste Client ID and Client Secret
   - Save

### 3. Environment Variables

Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Test the Authentication Flow

1. **Manufacturer sign-up:**
   - Go to `/auth/sign-up`
   - Click "Manufacturer"
   - Sign in with Google
   - Complete 4-step profile:
     - Basic info
     - Location
     - Add devices (at least one)
     - Select materials and tolerance tier
   - Should redirect to `/maker/dashboard`

2. **Client sign-up:**
   - Go to `/auth/sign-up`
   - Click "Client"
   - Sign in with Google
   - Complete profile:
     - Choose company or individual
     - Enter contact and address info
   - Should redirect to home page

3. **Sign in:**
   - Go to `/auth/sign-in`
   - Sign in with Google
   - Should redirect based on role

## File Structure

```
apps/web/
├── app/
│   ├── auth/
│   │   ├── sign-in/page.tsx          # Sign in page
│   │   ├── sign-up/page.tsx          # Sign up page (role selection)
│   │   ├── complete-profile/page.tsx # Profile completion handler
│   │   ├── callback/route.ts         # OAuth callback
│   │   └── sign-out/route.ts         # Sign out endpoint
│   └── maker/dashboard/              # Protected route
├── components/auth/
│   ├── ManufacturerProfileForm.tsx   # Manufacturer onboarding
│   └── ClientProfileForm.tsx         # Client onboarding
├── lib/supabase/
│   ├── client.ts                     # Browser Supabase client
│   ├── server.ts                     # Server Supabase client
│   └── middleware.ts                 # Auth middleware helper
└── middleware.ts                     # Next.js middleware

supabase/migrations/
├── 001_initial_schema.sql            # Base schema
└── 002_auth_profile_fields.sql       # Auth-related fields
```

## Security Features

1. **Row Level Security (RLS):**
   - All tables have RLS enabled
   - Users can only view/edit their own data
   - Admins have elevated permissions

2. **Route Protection:**
   - Middleware checks authentication on protected routes
   - Unauthenticated users redirected to sign-in
   - Authenticated users proceed to requested page

3. **Session Management:**
   - Secure cookie-based sessions
   - Automatic token refresh
   - Proper session invalidation on sign-out

## Testing Checklist

- [ ] Manufacturer can sign up with Google
- [ ] Manufacturer can complete all 4 profile steps
- [ ] Manufacturer can add multiple devices
- [ ] Manufacturer redirected to dashboard after sign-up
- [ ] Client can sign up with Google
- [ ] Client can choose company or individual
- [ ] Client redirected to home page after sign-up
- [ ] Unauthenticated users redirected from `/maker/*` routes
- [ ] Sign out clears session
- [ ] Database records created correctly
- [ ] RLS policies prevent unauthorized access

## Common Issues

1. **"Invalid API key" error:**
   - Check `.env.local` file exists and has correct values
   - Restart dev server after adding env variables

2. **OAuth callback fails:**
   - Verify redirect URI in Google Cloud Console matches Supabase callback URL exactly
   - Check Client ID/Secret in Supabase match Google Console

3. **Database errors:**
   - Ensure migrations have been run
   - Check Supabase project is active

4. **Middleware not working:**
   - Verify `middleware.ts` is in `apps/web/` root
   - Check Next.js version (should be 16.1.2)

## Next Steps

After authentication is working:
- Add profile editing functionality
- Add device management (add/remove/edit devices)
- Implement client dashboard
- Add admin panel for dispute management

