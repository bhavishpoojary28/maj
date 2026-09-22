-- Fix role constraint to match frontend (admin/engineer/operator)
-- Step 1: Drop old constraint first
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Migrate existing rows to new role values
UPDATE profiles SET role = 'engineer' WHERE role = 'inspector';
UPDATE profiles SET role = 'operator' WHERE role = 'maintenance';

-- Step 3: Add new constraint with frontend values
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin','engineer','operator'));

-- Step 4: Update default role to 'engineer'
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'engineer';

-- Step 5: Update trigger function to use new default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, zone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Railway Staff'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'engineer'),
    COALESCE(NEW.raw_user_meta_data->>'zone', 'NR')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
