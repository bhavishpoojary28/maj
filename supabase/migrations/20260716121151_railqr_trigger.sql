/*
# RailQR AI — Auto profile trigger

Creates a trigger that automatically inserts a row into `profiles` whenever a new
auth user signs up, using the role / full_name / zone passed in signUp metadata.

## 1. Functions
- `handle_new_user()` — SECURITY DEFINER trigger function that inserts into profiles.

## 2. Triggers
- `on_auth_user_created` — AFTER INSERT on auth.users, calls handle_new_user().

## 3. Security
- The function runs as SECURITY DEFINER so it can write to profiles even though the
  anon role normally cannot. RLS on profiles still applies to normal client queries.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, zone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Railway Staff'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'inspector'),
    COALESCE(NEW.raw_user_meta_data->>'zone', 'NR')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
