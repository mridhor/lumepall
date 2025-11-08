import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

let cachedSupabase: SupabaseClient | null | undefined

async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (cachedSupabase !== undefined) {
    return cachedSupabase
  }

  try {
    const { supabase } = await import('@/lib/supabase')
    cachedSupabase = supabase
  } catch (_error) {
    console.warn('Supabase not configured for subscribers API')
    cachedSupabase = null
  }

  return cachedSupabase ?? null
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const token = request.cookies.get('admin-token')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // If Supabase is not configured, return empty subscribers
    const supabase = await getSupabaseClient()
    if (!supabase) {
      console.log('Supabase not configured, returning empty subscribers');
      return NextResponse.json(
        { 
          subscribers: [],
          total: 0
        },
        { status: 200 }
      )
    }

    // Fetch subscribers from Supabase
    const { data, error } = await supabase
      .from('snobol_email_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscribers' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        subscribers: data,
        total: data?.length || 0
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
