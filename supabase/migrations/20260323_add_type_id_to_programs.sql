-- Add type_id column to programs table (references program_types)
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS type_id BIGINT REFERENCES public.program_types(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_programs_type_id ON public.programs(type_id);
