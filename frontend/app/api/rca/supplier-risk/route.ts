import { NextResponse } from 'next/server'

const RCA_API_BASE_URL =
  process.env.RCA_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const res = await fetch(`${RCA_API_BASE_URL}/rca/supplier-risk`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(`RCA supplier-risk API error: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching RCA supplier-risk:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch RCA supplier-risk',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}


