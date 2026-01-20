# Supabase Storage Policies - Exact Step-by-Step Instructions

## For `stl-files` Bucket

### Step 1: Navigate to Storage
1. Go to: https://supabase.com/dashboard/project/aywrgbfuoldtoeecsbvu
2. Click **"Storage"** in the left sidebar (folder icon)

### Step 2: Create Bucket (if not done)
1. Click **"New bucket"** button (top right)
2. **Bucket name:** Type exactly: `stl-files`
3. **Public bucket:** Toggle this ON (should be green/checked)
4. Click **"Create bucket"** button

### Step 3: Set Policies for `stl-files`

1. **Click on the `stl-files` bucket** (click the bucket name)

2. **Click the "Policies" tab** (at the top, next to "Files")

3. **Policy 1: Allow authenticated uploads**
   - Click **"New policy"** button
   - Click **"For full customization"** (the bottom option)
   - **Policy name:** Type: `Allow authenticated uploads`
   - **Allowed operation:** Select `INSERT` from dropdown
   - **Policy definition:** Click in the text box and paste this EXACT code:
   ```sql
   (
     (bucket_id = 'stl-files'::text) AND
     (auth.role() = 'authenticated'::text)
   )
   ```
   - Click **"Review"** button
   - Click **"Save policy"** button

4. **Policy 2: Allow authenticated reads**
   - Click **"New policy"** button again
   - Click **"For full customization"**
   - **Policy name:** Type: `Allow authenticated reads`
   - **Allowed operation:** Select `SELECT` from dropdown
   - **Policy definition:** Paste this EXACT code:
   ```sql
   (
     (bucket_id = 'stl-files'::text) AND
     (auth.role() = 'authenticated'::text)
   )
   ```
   - Click **"Review"** button
   - Click **"Save policy"** button

5. **Policy 3: Allow public reads**
   - Click **"New policy"** button again
   - Click **"For full customization"**
   - **Policy name:** Type: `Allow public reads`
   - **Allowed operation:** Select `SELECT` from dropdown
   - **Policy definition:** Paste this EXACT code:
   ```sql
   (bucket_id = 'stl-files'::text)
   ```
   - Click **"Review"** button
   - Click **"Save policy"** button

---

## For `qc-photos` Bucket

### Step 1: Create Bucket (if not done)
1. In Storage page, click **"New bucket"** button
2. **Bucket name:** Type exactly: `qc-photos`
3. **Public bucket:** Toggle this ON (should be green/checked)
4. Click **"Create bucket"** button

### Step 2: Set Policies for `qc-photos`

1. **Click on the `qc-photos` bucket** (click the bucket name)

2. **Click the "Policies" tab**

3. **Policy 1: Allow authenticated uploads**
   - Click **"New policy"** button
   - Click **"For full customization"**
   - **Policy name:** Type: `Allow authenticated uploads`
   - **Allowed operation:** Select `INSERT` from dropdown
   - **Policy definition:** Paste this EXACT code:
   ```sql
   (
     (bucket_id = 'qc-photos'::text) AND
     (auth.role() = 'authenticated'::text)
   )
   ```
   - Click **"Review"** button
   - Click **"Save policy"** button

4. **Policy 2: Allow authenticated reads**
   - Click **"New policy"** button
   - Click **"For full customization"**
   - **Policy name:** Type: `Allow authenticated reads`
   - **Allowed operation:** Select `SELECT` from dropdown
   - **Policy definition:** Paste this EXACT code:
   ```sql
   (
     (bucket_id = 'qc-photos'::text) AND
     (auth.role() = 'authenticated'::text)
   )
   ```
   - Click **"Review"** button
   - Click **"Save policy"** button

5. **Policy 3: Allow public reads**
   - Click **"New policy"** button
   - Click **"For full customization"**
   - **Policy name:** Type: `Allow public reads`
   - **Allowed operation:** Select `SELECT` from dropdown
   - **Policy definition:** Paste this EXACT code:
   ```sql
   (bucket_id = 'qc-photos'::text)
   ```
   - Click **"Review"** button
   - Click **"Save policy"** button

---

## ✅ Verification

After creating all policies, you should see:

**For `stl-files` bucket:**
- 3 policies listed in the Policies tab:
  1. Allow authenticated uploads (INSERT)
  2. Allow authenticated reads (SELECT)
  3. Allow public reads (SELECT)

**For `qc-photos` bucket:**
- 3 policies listed in the Policies tab:
  1. Allow authenticated uploads (INSERT)
  2. Allow authenticated reads (SELECT)
  3. Allow public reads (SELECT)

---

## 📝 Quick Copy-Paste Reference

### For `stl-files` bucket:

**Policy 1 (INSERT):**
```sql
(
  (bucket_id = 'stl-files'::text) AND
  (auth.role() = 'authenticated'::text)
)
```

**Policy 2 (SELECT - authenticated):**
```sql
(
  (bucket_id = 'stl-files'::text) AND
  (auth.role() = 'authenticated'::text)
)
```

**Policy 3 (SELECT - public):**
```sql
(bucket_id = 'stl-files'::text)
```

### For `qc-photos` bucket:

**Policy 1 (INSERT):**
```sql
(
  (bucket_id = 'qc-photos'::text) AND
  (auth.role() = 'authenticated'::text)
)
```

**Policy 2 (SELECT - authenticated):**
```sql
(
  (bucket_id = 'qc-photos'::text) AND
  (auth.role() = 'authenticated'::text)
)
```

**Policy 3 (SELECT - public):**
```sql
(bucket_id = 'qc-photos'::text)
```

---

## 🎯 Summary

**Total actions needed:**
- Create 2 buckets (if not done)
- Create 6 policies total (3 per bucket)

**Time:** ~10 minutes

**When done:** Tell me and we'll verify it works! ✅

