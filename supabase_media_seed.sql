-- Lumepall Media Seed Data - Updated with real articles from lumepall.ee
-- Run this SQL in your Supabase SQL Editor

-- First, ensure the table has required columns
ALTER TABLE lumepall_media ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE lumepall_media ADD COLUMN IF NOT EXISTS content TEXT;

-- Clear existing data and insert new articles
DELETE FROM lumepall_media;

INSERT INTO lumepall_media (title, description, type, slug, content, thumbnail_url, article_url, published_at, is_active)
VALUES 
  (
    'Neljas sünnipäev, võimalus rahvusliku kapitali tekkeks e EEPILINE UUDIS',
    'Lumepalli fondi neljas sünnipäev ja eepiline uudis tuleviku kohta.',
    'article',
    'neljas-sunnipaev-voimalus-rahvusliku-kapitali-tekkeks-e-eepiline-uudis',
    '<h2>Neljas sünnipäev</h2>
<p>Lumepalli fond tähistab oma neljanda aastapäeva. See on olnud põnev teekond ning me oleme tänulikud kõigile oma investoritele usalduse eest.</p>
<p>Sel puhul on meil eepiline uudis, mis puudutab rahvusliku kapitali tekkimist ja fondi tulevikku.</p>',
    '/article-sunnipaev.jpg',
    'https://www.lumepall.ee/neljas-sunnipaev-voimalus-rahvusliku-kapitali-tekkeks-e-eepiline-uudis',
    '2024-12-01T10:00:00Z',
    true
  ),
  (
    'Investoritepere - Kui noorelt saab alustada & 4 nippi investori kasvatamiseks',
    'Kuidas kasvatada lapsi investoriteks ja alustada investeerimisega võimalikult varakult.',
    'article',
    'investoritepere-kui-noorelt-saab-alustada-4-nippi-investori-kasvatamiseks',
    '<h2>Investoritepere</h2>
<p>Kui noorelt on võimalik investeerimisega alustada? Siin on 4 praktilist nippi, kuidas oma lapsi investoriteks kasvatada.</p>
<p>Varajane alustamine on üks võimsamaid eeliseid pikaajalise jõukuse loomisel.</p>',
    '/article-investoritepere.jpg',
    'https://www.lumepall.ee/investoritepere-kui-noorelt-saab-alustada--4-nippi-investori-kasvatamiseks',
    '2024-11-15T09:00:00Z',
    true
  ),
  (
    '"Musta lumepalli strateegia" - Kuidas teenida jätkusuutlikult 31,04% tootlust aastas?',
    'Tutvustame musta lumepalli strateegiat ja kuidas saavutada kõrget tootlust.',
    'article',
    'musta-lumepalli-strateegia-kuidas-teenida-jatkusuutlikult-3104-tootlust-aastas',
    '<h2>Musta lumepalli strateegia</h2>
<p>Kuidas teenida jätkusuutlikult 31,04% tootlust aastas? See artikkel selgitab meie investeerimisstrateegia aluspõhimõtteid.</p>
<p>Kriisidesse investeerimine nõuab kannatlikkust ja distsipliini, kuid tulemused kõnelevad enda eest.</p>',
    '/article-musta-lumepalli.jpg',
    'https://www.lumepall.ee/musta-lumepalli-strateegia-kuidas-teenida-jatkusuutlikult-3104-tootlust-aastas',
    '2024-10-20T14:00:00Z',
    true
  ),
  (
    'Kolm videot: Kuidas alustada? Kuhu investeerida? Kuhu mitte investeerida?',
    'Kolmeosaline videosari investeerimise põhitõdedest algajatele.',
    'article',
    'kolm-videot-kuidas-alustada-kuhu-investeerida-kuhu-mitte-investeerida',
    '<h2>Kolm videot investeerimisest</h2>
<p>Minu, kui fondijuhi ja investori käest küsitakse tihti sarnaseid küsimusi raha paigutamise kohta. Seepärast tekkis mõte teha videosari, mis püüaks neile küsimustele vastata.</p>
<p>Esimeses kolmes videos avame investeerimistemaatikat üldiselt: mis asi on aktsia, kuhu liigitada krüptovarasid, kuidas investeerimist efektiivselt alustada.</p>',
    '/article-kolm-videot.jpg',
    'https://www.lumepall.ee/kolm-videot-kuidas-alustada-kuhu-investeerida-kuhu-mitte-investeerida',
    '2024-09-05T11:00:00Z',
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  thumbnail_url = EXCLUDED.thumbnail_url,
  article_url = EXCLUDED.article_url,
  published_at = EXCLUDED.published_at,
  is_active = EXCLUDED.is_active;

-- Enable RLS and allow public read access
ALTER TABLE lumepall_media ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists and create new one
DROP POLICY IF EXISTS "Allow public read access on lumepall_media" ON lumepall_media;
CREATE POLICY "Allow public read access on lumepall_media"
ON lumepall_media
FOR SELECT
TO anon, authenticated
USING (true);

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_lumepall_media_slug ON lumepall_media(slug);

-- Verify data was inserted
SELECT id, title, slug, is_active FROM lumepall_media;
