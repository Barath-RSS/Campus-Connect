
-- 1. Input length / content CHECK constraints
ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_description_length_check,
  DROP CONSTRAINT IF EXISTS reports_response_length_check,
  DROP CONSTRAINT IF EXISTS reports_landmark_length_check;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_description_length_check
    CHECK (char_length(description) BETWEEN 1 AND 5000),
  ADD CONSTRAINT reports_response_length_check
    CHECK (official_response IS NULL OR char_length(official_response) <= 2000),
  ADD CONSTRAINT reports_landmark_length_check
    CHECK (landmark IS NULL OR char_length(landmark) <= 200);

ALTER TABLE public.access_requests
  DROP CONSTRAINT IF EXISTS access_requests_reason_length_check,
  DROP CONSTRAINT IF EXISTS access_requests_full_name_length_check;

ALTER TABLE public.access_requests
  ADD CONSTRAINT access_requests_reason_length_check
    CHECK (reason IS NULL OR char_length(reason) <= 500),
  ADD CONSTRAINT access_requests_full_name_length_check
    CHECK (char_length(full_name) BETWEEN 1 AND 100);

-- 2. Harden SECURITY DEFINER helper functions: explicit NULL guards + comments
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT
    CASE
      WHEN _user_id IS NULL OR _role IS NULL THEN false
      ELSE EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
      )
    END
$function$;

COMMENT ON FUNCTION public.has_role(uuid, app_role) IS
  'SECURITY DEFINER role check. Any change here is security-sensitive: must keep NULL guards, parameterised query, and search_path = public to prevent privilege escalation and search-path attacks.';

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT role
  FROM public.user_roles
  WHERE _user_id IS NOT NULL
    AND user_id = _user_id
  LIMIT 1
$function$;

COMMENT ON FUNCTION public.get_user_role(uuid) IS
  'SECURITY DEFINER role lookup. Keep NULL guard, parameterised query, and search_path = public; any modification requires security review.';

COMMENT ON FUNCTION public.handle_new_user() IS
  'SECURITY DEFINER trigger that mirrors auth.users metadata into public.profiles and assigns the default student role. Only auth.users insert events should fire this. Any change requires security review.';

-- 3. Lock down storage.objects for the issue-images bucket
DROP POLICY IF EXISTS "Anyone can view issue images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view issue images" ON storage.objects;
DROP POLICY IF EXISTS "Officials and staff can view all issue images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own issue images" ON storage.objects;

-- Officials and service staff may read every image (for triage / completion review)
CREATE POLICY "Officials and staff can view all issue images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'issue-images'
  AND (
    public.has_role(auth.uid(), 'official'::app_role)
    OR public.has_role(auth.uid(), 'staff'::app_role)
  )
);

-- Report owners may read images they uploaded (or images attached to their own reports)
CREATE POLICY "Report owners can view their issue images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'issue-images'
  AND (
    owner = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.reports r
      WHERE r.user_id = auth.uid()
        AND (
          r.image_url LIKE '%' || storage.objects.name
          OR r.image_url_2 LIKE '%' || storage.objects.name
          OR r.image_url_3 LIKE '%' || storage.objects.name
          OR r.completion_image_url LIKE '%' || storage.objects.name
        )
    )
  )
);
