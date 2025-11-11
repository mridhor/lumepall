import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

let cachedSupabase: SupabaseClient | null | undefined

async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (cachedSupabase !== undefined) return cachedSupabase
  try {
    const { supabase } = await import('@/lib/supabase')
    cachedSupabase = supabase
  } catch {
    cachedSupabase = null
  }
  return cachedSupabase ?? null
}

function toUsShortDate(datetimeUtc: string): string | null {
  const date = new Date(datetimeUtc.replace(' ', 'T') + 'Z')
  if (isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export async function POST(request: NextRequest) {
  try {
    // simple auth: reuse admin cookie
    const token = request.cookies.get('admin-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const contentType = request.headers.get('content-type') || ''

    // Accept text/csv or JSON body of [{ datetime_utc, value }]
    const rows: Array<{ date: string; snobol: number }> = []

    if (contentType.includes('text/csv')) {
      const text = await request.text()
      const lines = text.trim().split('\n')
      // expect header: datetime_utc,value
      for (const line of lines.slice(1)) {
        const [datetimeUtc, valueStr] = line.split(',')
        const formatted = toUsShortDate(datetimeUtc)
        const val = Number(valueStr)
        if (formatted && isFinite(val)) {
          rows.push({ date: formatted, snobol: val })
        }
      }
    } else {
      const body = await request.json().catch(() => null)
      if (!Array.isArray(body)) {
        return NextResponse.json({ error: 'Expected CSV or JSON array' }, { status: 400 })
      }
      for (const item of body) {
        const formatted = typeof item.datetime_utc === 'string' ? toUsShortDate(item.datetime_utc) : null
        const val = Number(item.value)
        if (formatted && isFinite(val)) {
          rows.push({ date: formatted, snobol: val })
        }
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid rows' }, { status: 400 })
    }

    // Upsert into lumepall_history(date text primary key, snobol numeric)
    const { error } = await supabase.from('lumepall_history').upsert(rows, {
      onConflict: 'date',
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, imported: rows.length })
    } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


