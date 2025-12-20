import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface ArticleData {
    id: string;
    title: string;
    description?: string;
    slug: string;
    content?: string;
    thumbnail_url?: string;
    published_at: string;
    created_at: string;
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await context.params;

        if (!slug) {
            return NextResponse.json(
                { error: 'Slug is required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('lumepall_media')
            .select('*')
            .eq('slug', slug)
            .eq('type', 'article')
            .eq('is_active', true)
            .single();

        if (error || !data) {
            console.error('Supabase error:', error);
            return NextResponse.json(
                { error: 'Article not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ article: data });
    } catch (error) {
        console.error('Failed to fetch article:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
