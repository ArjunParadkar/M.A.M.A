# Google OAuth Troubleshooting

If you're still seeing **"Unsupported provider: provider is not enabled"** after setting up Google:

## Immediate Checks

### 1. Verify in Supabase Dashboard

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Google** in the list
3. Make sure:
   - ✅ The toggle is **ON** (enabled/green)
   - ✅ **Client ID** field is filled (starts with something like `123456789-abc...`)
   - ✅ **Client Secret** field is filled (long string)
   - ✅ Clicked **Save** at the bottom

**Common mistake:** The toggle is ON but you forgot to click **Save** after entering the credentials.

### 2. Verify Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your **OAuth 2.0 Client ID**
3. Check **Authorized redirect URIs** contains:
   ```
   https://aywrgbfuoldtoeecsbvu.supabase.co/auth/v1/callback
   ```
4. Make sure there are no typos or trailing slashes

### 3. Check for Typos

- **Client ID**: Should be like `123456789-abc123def456.apps.googleusercontent.com`
- **Client Secret**: Should be a long random string like `GOCSPX-abc123...`
- **Redirect URI**: Must be **exactly** `https://aywrgbfuoldtoeecsbvu.supabase.co/auth/v1/callback` (no trailing slash)

### 4. Propagation Time

- Usually **instant** (< 5 seconds)
- If not working after 1-2 minutes, something is wrong
- Try **disabling** the Google provider in Supabase, clicking **Save**, then **enabling** it again and **Save**

### 5. Clear Browser Cache

- Try in an **Incognito/Private window**
- Or clear browser cache and cookies for `localhost:3000`
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

### 6. Check Supabase Logs

1. Supabase Dashboard → **Logs** → **Auth Logs**
2. Look for errors when you try to sign in with Google
3. Common errors:
   - "Invalid client secret" → Wrong secret in Supabase
   - "Redirect URI mismatch" → Wrong redirect URI in Google Console
   - "Provider not enabled" → Toggle not saved in Supabase

## Step-by-Step Reset (if still not working)

1. **In Supabase:**
   - Go to **Authentication** → **Providers** → **Google**
   - Turn the toggle **OFF**, click **Save**
   - Turn it **ON** again
   - Re-enter **Client ID** and **Client Secret** (copy-paste fresh)
   - Click **Save**

2. **In Google Cloud Console:**
   - Go to **APIs & Services** → **Credentials**
   - Edit your OAuth 2.0 Client ID
   - Under **Authorized redirect URIs**, verify:
     ```
     https://aywrgbfuoldtoeecsbvu.supabase.co/auth/v1/callback
     ```
   - Click **Save**

3. **Wait 10 seconds**, then try Google sign-in again

## Alternative: Use Email Sign-In (Works Now)

While troubleshooting Google, you can **sign up and sign in with email/password** - that works immediately and doesn't require Google OAuth setup.

Just use the **Email** tab on the sign-in/sign-up pages.

## Still Not Working?

Check:
- Are you using the **correct Supabase project**? (verify the project reference ID matches)
- Did you create **OAuth 2.0 Client ID** (not Service Account)?
- Is the **Application type** set to **Web application** in Google Console?
- In Supabase, are you in the right **project** (check the project name in the top left)?

