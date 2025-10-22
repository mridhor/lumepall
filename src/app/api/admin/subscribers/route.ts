import { NextRequest, NextResponse } from 'next/server'

// Check if Supabase is properly configured
let supabase: any = null;
try {
  const { supabase: supabaseClient } = require('@/lib/supabase');
  supabase = supabaseClient;
} catch (error) {
  console.warn('Supabase not configured for subscribers API');
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
