import { NextResponse } from 'next/server'

const UEBA_API_BASE_URL =
  process.env.UEBA_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const res = await fetch(`${UEBA_API_BASE_URL}/ueba/summary`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(`UEBA summary API error: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching UEBA summary:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch UEBA summary',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}


