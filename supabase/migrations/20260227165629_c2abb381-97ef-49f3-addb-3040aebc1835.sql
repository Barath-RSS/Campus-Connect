
-- Add resolved_by to track which staff member resolved each report
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS resolved_by uuid;

-- Add extra image columns for students to upload up to 3 photos
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS image_url_2 text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS image_url_3 text;
