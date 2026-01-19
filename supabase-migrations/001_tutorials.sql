-- ============================================================================
-- Tutorials Feature - Database Schema
-- ============================================================================
-- This migration creates the necessary tables and policies for the tutorials feature.
-- It allows Spolky and admins to create tutorials that are visible to students
-- based on their association membership.

-- ============================================================================
-- Tables
-- ============================================================================

-- Tutorials table
CREATE TABLE IF NOT EXISTS public.tutorials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tutorial slides table
CREATE TABLE IF NOT EXISTS public.tutorial_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutorial_id UUID NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL,
    layout TEXT NOT NULL CHECK (layout IN ('single', 'two-column', 'two-column-wide-left', 'two-column-wide-right')),
    
    -- Left/main column
    left_icon TEXT,
    left_title TEXT,
    left_content TEXT,
    left_image_url TEXT,
    
    -- Right column (for two-column layouts)
    right_icon TEXT,
    right_title TEXT,
    right_content TEXT,
    right_image_url TEXT,
    
    UNIQUE(tutorial_id, "order")
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tutorials_association ON public.tutorials(association_id);
CREATE INDEX IF NOT EXISTS idx_tutorials_published ON public.tutorials(is_published);
CREATE INDEX IF NOT EXISTS idx_slides_tutorial ON public.tutorial_slides(tutorial_id);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_slides ENABLE ROW LEVEL SECURITY;

-- Tutorials policies
-- 1. Anyone can read published tutorials
CREATE POLICY "Anyone can view published tutorials"
    ON public.tutorials
    FOR SELECT
    USING (is_published = true);

-- 2. Authenticated users from spolky_accounts can create tutorials for their association
CREATE POLICY "Spolky can create tutorials for their association"
    ON public.tutorials
    FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            SELECT email 
            FROM public.spolky_accounts 
            WHERE association_id = tutorials.association_id
        )
    );

-- 3. Authenticated users can update their own association's tutorials
CREATE POLICY "Spolky can update their association's tutorials"
    ON public.tutorials
    FOR UPDATE
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT email 
            FROM public.spolky_accounts 
            WHERE association_id = tutorials.association_id
        )
    );

-- 4. Authenticated users can delete their own association's tutorials
CREATE POLICY "Spolky can delete their association's tutorials"
    ON public.tutorials
    FOR DELETE
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT email 
            FROM public.spolky_accounts 
            WHERE association_id = tutorials.association_id
        )
    );

-- Tutorial slides policies
-- 1. Anyone can read slides for published tutorials
CREATE POLICY "Anyone can view slides for published tutorials"
    ON public.tutorial_slides
    FOR SELECT
    USING (
        tutorial_id IN (
            SELECT id FROM public.tutorials WHERE is_published = true
        )
    );

-- 2. Authenticated users can manage slides for their association's tutorials
CREATE POLICY "Spolky can manage slides for their tutorials"
    ON public.tutorial_slides
    FOR ALL
    USING (
        tutorial_id IN (
            SELECT t.id 
            FROM public.tutorials t
            INNER JOIN public.spolky_accounts sa ON sa.association_id = t.association_id
            WHERE sa.email = auth.jwt() ->> 'email'
        )
    );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_tutorials_updated_at
    BEFORE UPDATE ON public.tutorials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Storage Bucket Setup (run separately in Supabase Storage UI or via SQL)
-- ============================================================================
-- This creates a public bucket for tutorial images.
-- If running manually, you can also do this via the Supabase Dashboard:
-- 1. Go to Storage
-- 2. Create new bucket: "tutorial-images"
-- 3. Set to Public
-- 4. Configure policies as shown below

INSERT INTO storage.buckets (id, name, public)
VALUES ('tutorial-images', 'tutorial-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tutorial-images bucket
CREATE POLICY "Anyone can view tutorial images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'tutorial-images');

CREATE POLICY "Authenticated users can upload tutorial images"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'tutorial-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can update tutorial images"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'tutorial-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can delete tutorial images"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'tutorial-images' 
        AND auth.role() = 'authenticated'
    );
