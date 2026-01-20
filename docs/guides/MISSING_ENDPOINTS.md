# Missing API Endpoints That Need to Be Created

These endpoints are referenced in the code but don't exist yet. They need to be created for full functionality.

## 1. `/api/jobs/[jobId]` - Get Job Details

**Used in**: `apps/web/app/maker/jobs/qc/[jobId]/page.tsx`

**Purpose**: Fetch job details by ID

**Create**: `apps/web/app/api/jobs/[jobId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', params.jobId)
      .single();
    
    if (error || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(job);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
```

---

## 2. `/api/manufacturers/by-user/[userId]` - Get Manufacturer by User ID

**Used in**: `apps/web/app/maker/workflow/page.tsx`

**Purpose**: Get manufacturer profile from user ID

**Create**: `apps/web/app/api/manufacturers/by-user/[userId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get profile first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', params.userId)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }
    
    // Get manufacturer
    const { data: manufacturer, error: mfgError } = await supabase
      .from('manufacturers')
      .select('*')
      .eq('user_id', params.userId)
      .single();
    
    if (mfgError || !manufacturer) {
      return NextResponse.json(
        { error: 'Manufacturer not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(manufacturer);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
```

---

## 3. `/api/auth/session` - Get Current User Session

**Used in**: `apps/web/app/maker/workflow/page.tsx`

**Purpose**: Get current authenticated user

**Create**: `apps/web/app/api/auth/session/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      );
    }
    
    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
```

---

## Quick Fix: Create All Three Endpoints

Run these commands to create the missing endpoints:

```bash
# Create directories
mkdir -p apps/web/app/api/jobs/\[jobId\]
mkdir -p apps/web/app/api/manufacturers/by-user/\[userId\]
mkdir -p apps/web/app/api/auth/session

# Then create the route.ts files with the code above
```

