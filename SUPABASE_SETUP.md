# Supabase Database & Authentication Setup Guide for StoryForge AI

This guide provides step-by-step instructions for setting up Supabase PostgreSQL and Authentication for **StoryForge AI**.

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com/](https://supabase.com/) and sign in or create an account.
2. Click **"New Project"**.
3. Select your organization and enter:
   - **Name**: `StoryForge AI`
   - **Database Password**: Create a strong password.
   - **Region**: Select a region close to your target users.
4. Click **"Create new project"** and wait for deployment to complete.

---

## 2. Configure Supabase Authentication

1. Open your Supabase Dashboard and click on **Authentication** in the left sidebar.
2. Go to **Providers** -> **Email**.
3. Ensure **Email provider** is **Enabled**.
4. (Optional for testing) Under **Auth Settings**, you can uncheck **"Confirm email"** if you want users to log in immediately upon registration without email verification.

---

## 3. Obtain API Keys

1. In your Supabase Dashboard, go to **Project Settings** -> **API**.
2. Copy the following keys:
   - **Project URL**: `SUPABASE_URL` (e.g., `https://xyzcompany.supabase.co`)
   - **anon / public key**: `SUPABASE_ANON_KEY` (e.g., `eyJhbGciOi...`)
3. Paste these keys into your local `.env` file and Render environment variables.

---

## 4. Run SQL to Create Tables & Enable RLS

1. Go to the **SQL Editor** in the Supabase Dashboard sidebar.
2. Click **"New query"**.
3. Paste and run the following complete SQL script:

```sql
-- ==================================================================
-- 1. CREATE STORIES TABLE
-- ==================================================================
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    genre TEXT NOT NULL,
    mood TEXT NOT NULL,
    language TEXT NOT NULL,
    length TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stories_user_id_idx ON public.stories(user_id);
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own stories" ON public.stories;
DROP POLICY IF EXISTS "Users can insert their own stories" ON public.stories;
DROP POLICY IF EXISTS "Users can delete their own stories" ON public.stories;

CREATE POLICY "Users can view their own stories" ON public.stories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stories" ON public.stories FOR DELETE USING (auth.uid() = user_id);

-- ==================================================================
-- 2. CREATE PROFILES TABLE (DYNAMICALLY SYNCED WITH HASHES & LOGINS)
-- ==================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    password_hash TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles insert policy" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles update policy" ON public.profiles;

CREATE POLICY "Public profiles select policy" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public profiles insert policy" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public profiles update policy" ON public.profiles FOR UPDATE USING (true);

-- ==================================================================
-- 3. AUTOMATIC TRIGGER TO DYNAMICALLY POPULATE & UPDATE PROFILES
-- ==================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, password_hash, last_login_at, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NEW.encrypted_password,
    NOW(),
    NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    last_login_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto confirm all users for dynamic login capability
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;
```



4. Click **Run**. You should see "Success. No rows returned".

---

## 5. Verification Checklist

- [x] Email authentication enabled in Supabase Auth.
- [x] `stories` table created with `user_id` foreign key referencing `auth.users(id)`.
- [x] Row Level Security (RLS) enabled on `stories` table.
- [x] RLS policies created for `SELECT`, `INSERT`, and `DELETE`.
- [x] `SUPABASE_URL` and `SUPABASE_ANON_KEY` saved in `.env`.
