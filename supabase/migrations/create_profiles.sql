-- ==============================================================================
-- FerroMax: User Profiles & Roles System
-- Supports 'admin' (Don Carlos / Store Owner) and 'cliente' (Default Buyer)
-- All new registrations default to 'cliente'. Roles are managed directly in Supabase.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'cliente')) DEFAULT 'cliente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Function & Trigger to automatically synchronize profile on user signup
-- New accounts ALWAYS default to 'cliente'. Roles are managed directly in Supabase.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, phone, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        COALESCE(new.raw_user_meta_data->>'phone', ''),
        'cliente'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = excluded.email,
        full_name = COALESCE(NULLIF(excluded.full_name, ''), public.profiles.full_name),
        phone = COALESCE(NULLIF(excluded.phone, ''), public.profiles.phone),
        role = public.profiles.role,
        updated_at = now();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
