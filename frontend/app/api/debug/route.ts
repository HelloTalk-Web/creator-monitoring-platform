import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || 'No User-Agent'
  const allHeaders = Object.fromEntries(request.headers.entries())

  return NextResponse.json({
    userAgent,
    allHeaders,
    url: request.url,
    method: request.method,
  }, {
    headers: {
      'Content-Type': 'application/json',
    }
  })
}
