-- Lumepall Media Seed Data
-- Run this SQL in your Supabase SQL Editor to add dummy article data

-- First, ensure the table has a slug column (add if missing)
ALTER TABLE lumepall_media ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE lumepall_media ADD COLUMN IF NOT EXISTS content TEXT;

-- Insert dummy article data
INSERT INTO lumepall_media (title, description, type, slug, content, thumbnail_url, article_url, published_at, is_active)
VALUES 
  (
    'Crisis Investing: The Contrarian Approach',
    'Why the best investment opportunities emerge during market crises and how to identify them.',
    'article',
    'crisis-investing-contrarian-approach',
    '<h2>The Art of Contrarian Investing</h2>
<p>When markets panic, opportunities arise. This fundamental truth has guided successful investors for generations. The key is not to follow the crowd, but to maintain discipline when others lose theirs.</p>

<h3>Understanding Market Psychology</h3>
<p>Markets are driven by human emotions — fear and greed. During crises, fear dominates, pushing asset prices below their intrinsic value. This creates asymmetric risk-reward opportunities for those with the conviction to act.</p>

<h3>Key Principles</h3>
<p><strong>1. Patience is essential.</strong> Crises don''t resolve overnight. Position sizing and timing matter more than being "right."</p>
<p><strong>2. Quality over speculation.</strong> Focus on assets with strong fundamentals temporarily mispriced by panic selling.</p>
<p><strong>3. Maintain liquidity.</strong> Having capital available during crises is itself an advantage.</p>

<h3>Historical Examples</h3>
<p>The 2008 financial crisis, the 2020 pandemic crash, and numerous regional crises have all presented significant opportunities for prepared investors. Those who bought quality assets during peak fear often saw returns far exceeding market averages.</p>

<p style="color: #666; font-style: italic;">The best time to invest is when others are most fearful. – Warren Buffett</p>',
    '/article-crisis-investing.jpg',
    '/article/crisis-investing-contrarian-approach',
    '2024-11-15T10:00:00Z',
    true
  ),
  (
    'Nordic Values in Modern Finance',
    'How Scandinavian principles of patience and sustainability shape our investment philosophy.',
    'article',
    'nordic-values-modern-finance',
    '<h2>The Nordic Approach to Wealth Building</h2>
<p>In Nordic culture, there is a concept called "lagom" — not too much, not too little, but just right. This philosophy extends naturally to our approach to investing and wealth management.</p>

<h3>Sustainability Over Speed</h3>
<p>While many investors chase quick returns, the Nordic approach emphasizes steady, sustainable growth. Like a snowball (snøbol) rolling downhill, small consistent gains compound into significant wealth over time.</p>

<h3>Transparency and Trust</h3>
<p>Nordic societies are built on trust and transparency. We believe these values should extend to financial services. Investors deserve clear communication about strategies, risks, and performance.</p>

<h3>Long-term Thinking</h3>
<p>Short-term market movements are noise. What matters is the fundamental trajectory over years and decades. This patient perspective allows us to capitalize on opportunities others miss in their rush for immediate results.</p>

<p>By embracing these principles, we aim to build not just wealth, but peace of mind for our investors.</p>',
    '/article-nordic-values.jpg',
    '/article/nordic-values-modern-finance',
    '2024-10-28T09:00:00Z',
    true
  ),
  (
    'Understanding AI in Asset Management',
    'How artificial intelligence is transforming investment decisions and what it means for the future.',
    'article',
    'understanding-ai-asset-management',
    '<h2>The Rise of AI-Driven Investing</h2>
<p>Artificial intelligence is no longer science fiction in finance — it''s reality. From pattern recognition to predictive analytics, AI is reshaping how investment decisions are made.</p>

<h3>What AI Can Do</h3>
<p><strong>Pattern Recognition:</strong> AI can analyze vast amounts of data to identify patterns invisible to human analysts. Market trends, sentiment shifts, and correlation changes can be detected in real-time.</p>
<p><strong>Risk Assessment:</strong> Machine learning models can evaluate portfolio risk across multiple dimensions simultaneously, providing more nuanced risk management.</p>
<p><strong>Systematic Execution:</strong> AI removes emotional bias from trading decisions, executing strategies with precision and consistency.</p>

<h3>The Human Element</h3>
<p>Despite AI''s capabilities, human judgment remains essential. AI excels at processing data but lacks the contextual understanding and ethical reasoning that humans provide. The future lies in human-AI collaboration, not replacement.</p>

<h3>Our Vision</h3>
<p>At Snobol, we believe the next great contrarian investor will be AI-augmented. By combining algorithmic precision with human wisdom, we aim to achieve returns that neither could accomplish alone.</p>',
    '/article-ai-investing.jpg',
    '/article/understanding-ai-asset-management',
    '2024-09-20T14:00:00Z',
    true
  ),
  (
    'The Power of Compound Growth',
    'Why starting early and staying consistent is the most reliable path to financial freedom.',
    'article',
    'power-of-compound-growth',
    '<h2>The Eighth Wonder of the World</h2>
<p>Albert Einstein allegedly called compound interest "the eighth wonder of the world." Whether he actually said it matters less than its truth: compound growth is the most powerful force in wealth building.</p>

<h3>The Math Behind the Magic</h3>
<p>Consider two investors: Alex starts investing €100 monthly at age 20, while Sam starts at 30. Assuming 8% annual returns:</p>
<ul>
<li>Alex at 60: €350,000+ (investing €48,000 total)</li>
<li>Sam at 60: €150,000+ (investing €36,000 total)</li>
</ul>
<p>Those 10 extra years more than doubled Alex''s wealth, despite only €12,000 more contributed.</p>

<h3>The Habits That Matter</h3>
<p><strong>Consistency:</strong> Regular contributions, regardless of market conditions, build wealth over time.</p>
<p><strong>Patience:</strong> Compound growth is slow initially but accelerates dramatically over decades.</p>
<p><strong>Reinvestment:</strong> Let dividends and gains work for you. Don''t interrupt the snowball.</p>

<h3>It''s Never Too Late</h3>
<p>While earlier is better, starting today is always better than starting tomorrow. Every day of delay costs you future compound growth. The best time to plant a tree was 20 years ago. The second best time is now.</p>',
    '/article-compound-growth.jpg',
    '/article/power-of-compound-growth',
    '2024-08-05T11:00:00Z',
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  thumbnail_url = EXCLUDED.thumbnail_url,
  published_at = EXCLUDED.published_at,
  is_active = EXCLUDED.is_active;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_lumepall_media_slug ON lumepall_media(slug);
