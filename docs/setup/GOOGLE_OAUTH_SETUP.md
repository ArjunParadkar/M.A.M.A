# Enable Google Sign-In in Supabase

If you see **"Unsupported provider: provider is not enabled"** or **"Google sign-in is not enabled"**, turn on the Google provider in Supabase:

## 1. Open Supabase Auth settings

1. Go to [Supabase Dashboard](https://app.supabase.com) and open your project.
2. In the left sidebar, open **Authentication** → **Providers**.

## 2. Enable Google

1. Find **Google** in the list.
2. Turn the **Enable Sign in with Google** toggle **ON**.
3. A form will appear for **Client ID** and **Client Secret**.

## 3. Create Google OAuth credentials

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project (top bar).
3. Go to **APIs & Services** → **Credentials**.
4. Click **Create credentials** → **OAuth client ID**.
5. If asked, set **Application type** to **Web application** and **User type** to **External** (or Internal for a closed group).
6. **Authorized JavaScript origins**: add:
   - `http://localhost:3000` (for local development)
   - `https://your-domain.com` (for production, if you have a custom domain)

7. **Authorized redirect URIs**: add **both** (Google accepts both `http://` and `https://`):
   - `http://localhost:3000/auth/callback` (for local development)
   - `https://aywrgbfuoldtoeecsbvu.supabase.co/auth/v1/callback` (Supabase callback - **this is required**)
   
   Replace `aywrgbfuoldtoeecsbvu` with your **Project reference ID** if it's different (Dashboard → Settings → General → Reference ID).
8. Click **Create**, then copy the **Client ID** and **Client Secret**.

## 4. Put them into Supabase

1. Back in Supabase: **Authentication** → **Providers** → **Google**.
2. Paste **Client ID** and **Client Secret**.
3. Click **Save**.

## 5. Test

- Use **Sign in** or **Sign up** and choose **Google**.
- You should be redirected to Google, then back to your app.

---

**Until Google is enabled:** use the **Email** tab on the sign-in/sign-up pages to create and sign in to accounts.

