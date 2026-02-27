
-- Add tags and sort_order columns to notes table
ALTER TABLE public.notes ADD COLUMN tags text[] DEFAULT '{}';
ALTER TABLE public.notes ADD COLUMN sort_order integer DEFAULT 0;

-- Index for efficient tag filtering
CREATE INDEX idx_notes_tags ON public.notes USING GIN(tags);
