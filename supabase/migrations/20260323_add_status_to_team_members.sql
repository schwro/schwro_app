-- Add status column to team member tables for active/inactive toggle
ALTER TABLE public.worship_team ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Aktywny';
ALTER TABLE public.media_team ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Aktywny';
ALTER TABLE public.atmosfera_members ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Aktywny';
