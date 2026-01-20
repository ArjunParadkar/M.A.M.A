# Supabase Storage Setup Instructions

**📋 For exact step-by-step instructions with screenshots, see `SUPABASE_STORAGE_POLICIES_EXACT_STEPS.md`**

## Step 1: Create Storage Buckets

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/aywrgbfuoldtoeecsbvu
   - Click on **"Storage"** in the left sidebar

2. **Create `stl-files` Bucket**
   - Click **"New bucket"**
   - Name: `stl-files`
   - Make it **Public**: ✅ Yes (so files can be accessed via URL)
   - Click **"Create bucket"**

3. **Create `qc-photos` Bucket**
   - Click **"New bucket"** again
   - Name: `qc-photos`
   - Make it **Public**: ✅ Yes
   - Click **"Create bucket"**

## Step 2: Set RLS Policies

**See `SUPABASE_STORAGE_POLICIES_EXACT_STEPS.md` for detailed click-by-click instructions!**

### Quick Reference - SQL Code to Paste:

**For `stl-files` bucket - Policy 1 (INSERT):**
```sql
(
  (bucket_id = 'stl-files'::text) AND
  (auth.role() = 'authenticated'::text)
)
```

**For `stl-files` bucket - Policy 2 (SELECT - authenticated):**
```sql
(
  (bucket_id = 'stl-files'::text) AND
  (auth.role() = 'authenticated'::text)
)
```

**For `stl-files` bucket - Policy 3 (SELECT - public):**
```sql
(bucket_id = 'stl-files'::text)
```

**For `qc-photos` bucket - Same as above, but replace `stl-files` with `qc-photos`**

## Step 3: Test Upload (Optional)

1. In Supabase Storage dashboard, click on a bucket
2. Click **"Upload file"**
3. Upload a test file (any file)
4. Verify it appears and you can get a public URL

## Step 4: Get Storage URLs

- Once files are uploaded, you'll get URLs like:
  - `https://aywrgbfuoldtoeecsbvu.supabase.co/storage/v1/object/public/stl-files/filename.stl`
  - `https://aywrgbfuoldtoeecsbvu.supabase.co/storage/v1/object/public/qc-photos/job-id/photo-1.jpg`

## Done! ✅

After completing these steps, the code I've written will be able to:
- Upload STL files to `stl-files` bucket
- Upload QC photos to `qc-photos` bucket
- Retrieve files via their public URLs

