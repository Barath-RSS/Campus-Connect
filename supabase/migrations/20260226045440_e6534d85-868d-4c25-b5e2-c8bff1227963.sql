
-- Add contact_number and emp_id columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emp_id text;

-- Create unique index on emp_id for staff lookup
CREATE UNIQUE INDEX IF NOT EXISTS profiles_emp_id_unique ON public.profiles (emp_id) WHERE emp_id IS NOT NULL;

-- Update handle_new_user trigger to store contact_number and emp_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, register_no, contact_number, emp_id)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name', 
    NEW.email,
    NEW.raw_user_meta_data ->> 'register_no',
    NEW.raw_user_meta_data ->> 'contact_number',
    NEW.raw_user_meta_data ->> 'emp_id'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$function$;
