-- Only administrators and engineers may change a complaint's workflow status.
CREATE OR REPLACE FUNCTION public.can_manage_complaint_status()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'engineer')
  );
$$;

REVOKE ALL ON FUNCTION public.can_manage_complaint_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_complaint_status() TO authenticated;

DROP POLICY IF EXISTS "update_complaints_staff" ON public.complaints;
DROP POLICY IF EXISTS "update_complaints_admin_engineer" ON public.complaints;
CREATE POLICY "update_complaints_admin_engineer" ON public.complaints
  FOR UPDATE TO authenticated
  USING (public.can_manage_complaint_status())
  WITH CHECK (public.can_manage_complaint_status());
