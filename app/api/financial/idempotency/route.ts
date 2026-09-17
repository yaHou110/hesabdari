import { NextRequest, NextResponse } from 'next/server';
import { idempotencyEngine } from '@/lib/idempotency';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const key = url.searchParams.get('key');

  if (key) {
    const record = idempotencyEngine.getRecord(key);
    if (!record) {
      return NextResponse.json({ error: 'KEY_NOT_FOUND', message: `Idempotency key '${key}' not found.` }, { status: 404 });
    }
    return NextResponse.json({ record });
  }

  const records = idempotencyEngine.getAllRecords();
  return NextResponse.json({
    totalKeys: records.length,
    records,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, key } = body;

  if (action === 'generate') {
    const newKey = idempotencyEngine.generateKey(body.prefix || 'idemp');
    return NextResponse.json({ key: newKey });
  }

  if (action === 'clear-expired') {
    const cleared = idempotencyEngine.clearExpired();
    return NextResponse.json({ clearedCount: cleared });
  }

  if (action === 'delete' && key) {
    const deleted = idempotencyEngine.deleteRecord(key);
    return NextResponse.json({ success: deleted });
  }

  return NextResponse.json({ error: 'INVALID_ACTION' }, { status: 400 });
}
