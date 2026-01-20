# Demo Flow Guide: Arham & Reva

This guide explains how to use the demo flow between **Arham (Client)** and **Reva (Maker)**.

## Demo Mode Setup

Demo mode is automatically enabled in development. The system uses localStorage to store demo data between pages.

## Demo Flow

### 1. Arham (Client) Creates Orders

**Location:** `/client/dashboard` → Click "New" → Choose order type

**Order Types:**
1. **Quick Service** - Auto-assigned to Reva
2. **Closed Commission** - Arham chooses Reva from matches
3. **Closed Request** - Arham chooses Reva from matches  
4. **Open Request** - Auto-distributed to multiple manufacturers (including Reva)

**Steps:**
1. Upload `predator.stl` (or any STL file)
2. Fill in specifications (material, tolerance, quantity, deadline, etc.)
3. Click "Upload & Analyze"
4. Review AI analysis (price estimate, manufacturer matches)
5. Click "Submit Order"

**What Happens:**
- Job is saved to demo data
- For Quick Service: Auto-assigned to Reva
- For Open Request: Auto-distributed to multiple manufacturers (including Reva)
- For Closed Request/Commission: Reva appears in matches, Arham can select her

### 2. Reva (Maker) Sees Notifications

**Location:** `/maker/dashboard` → "New Requests" button (notification badge)

**What Reva Sees:**
- Notification count badge on "New Requests" button
- List of jobs assigned to her (from Arham or auto-distribution)

### 3. Reva Accepts Jobs

**Location:** `/maker/new-requests` → Click job → "Accept Request"

**Steps:**
1. Click on a job from notifications
2. Review job details (material, quantity, deadline, pay)
3. Click "Accept Request"
4. For Open Requests: Specify quantity to accept

**What Happens:**
- Job status changes to "accepted"
- Notification is removed
- Job appears in Reva's workflow
- Workflow automatically calculates device assignments

### 4. Reva's Workflow

**Location:** `/maker/workflow` or `/maker/dashboard` → "Current Workflow" tab

**What Reva Sees:**
- Optimized schedule with device assignments
- Which device handles which job, when
- Estimated completion times
- Priority levels
- Device utilization metrics

**Devices:**
- CNC Milling Machine #1
- 3D Printer (FDM)
- Laser Cutter

### 5. Arham's Workflow View

**Location:** `/client/dashboard` → Click on ongoing service → "View & Message" → Workflow tab

**What Arham Sees:**
- For Open Requests: All assigned manufacturers with their progress
- For Closed Requests/Commissions: Single manufacturer (Reva) progress
- Expected delivery dates
- Progress tracking (completed/assigned)
- Pay amounts per manufacturer

## Demo Data Storage

Demo data is stored in `localStorage` with these keys:
- `demo_jobs` - All demo jobs
- `demo_notifications_reva` - Reva's notifications
- `demo_workflow_reva` - Reva's workflow tasks

## Testing the Flow

1. **Start as Arham:**
   ```
   Navigate to: /client/dashboard
   User: Arham (automatically set in demo mode)
   ```

2. **Create 4 different order types:**
   - Quick Service → Auto-assigned to Reva
   - Closed Request → Choose Reva from matches
   - Closed Commission → Choose Reva from matches
   - Open Request → Auto-distributed (Reva included)

3. **Switch to Reva:**
   ```
   Navigate to: /maker/dashboard
   User: Reva (automatically set in demo mode)
   ```

4. **Accept jobs:**
   - See notifications → Click "New Requests"
   - Accept jobs → See them appear in workflow

5. **Check workflows:**
   - Reva's workflow: `/maker/workflow` (device assignments)
   - Arham's workflow: Click on any job → View workflow (manufacturer assignments)

## Notes

- Demo mode persists across page refreshes
- To reset demo data, clear localStorage or run `clearDemoData()` in console
- STL file uploads use Supabase Storage (same as production)
- AI analysis uses real API endpoints (F1-F4 models)

## File Locations

- Demo data manager: `apps/web/lib/demoData.ts`
- Client dashboard: `apps/web/app/client/dashboard/page.tsx`
- Maker dashboard: `apps/web/app/maker/dashboard/page.tsx`
- Processing page: `apps/web/app/client/new-order/processing/page.tsx`
- New requests: `apps/web/app/maker/new-requests/page.tsx`
- Workflow pages: `apps/web/app/maker/workflow/page.tsx` and `apps/web/app/client/jobs/[jobId]/workflow/page.tsx`


