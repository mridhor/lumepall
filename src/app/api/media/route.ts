import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'article';
  thumbnail_url?: string;
  image_url?: string;
  video_url?: string;
  article_url?: string;
  slug?: string;
  content?: string;
  published_at: string;
  created_at: string;
  is_active: boolean;
}

export async function GET() {
  // Check if Supabase is configured
  console.log('Media API - Supabase configured:', isSupabaseConfigured);

  if (!isSupabaseConfigured || !supabase) {
    console.log('Supabase not configured, returning empty media array');
    return NextResponse.json({ media: [], debug: 'supabase_not_configured' });
  }

  try {
    const { data, error } = await supabase
      .from('lumepall_media')
      .select('*')
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .limit(4);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ media: [], debug: 'supabase_query_error', error: error.message });
    }

    console.log('Fetched media from Supabase:', data?.length || 0, 'items');
    return NextResponse.json({ media: data || [] });
  } catch (error) {
    console.error('Failed to fetch media:', error);
    return NextResponse.json({ media: [], debug: 'catch_error' });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, type, image_url, thumbnail_url, video_url, article_url } = body;

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('lumepall_media')
      .insert([
        {
          title,
          description,
          type,
          thumbnail_url,
          image_url,
          video_url,
          article_url,
          published_at: new Date().toISOString(),
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to create media item' }, { status: 500 });
    }

    return NextResponse.json({ media: data });
  } catch (error) {
    console.error('Failed to create media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
