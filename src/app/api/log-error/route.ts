import { NextRequest, NextResponse } from 'next/server';

/**
 * Receives client-side error reports and console.errors them server-side, so
 * they land in the deployment's function logs — a real, if basic, alternative
 * to finding out about a broken page from a user's own screenshot. Never
 * fails the caller: a malformed or missing body just means less context in
 * the log line, not a second error on top of the one being reported.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.error('[client error report]', JSON.stringify(body));
  } catch {
    console.error('[client error report] received a malformed report body');
  }
  return NextResponse.json({ ok: true });
}
