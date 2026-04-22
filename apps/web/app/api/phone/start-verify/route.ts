import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { startVerification, toE164 } from '@/lib/twilio';

export const runtime = 'nodejs';

const Body = z.object({ phone: z.string().min(5).max(30) });

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const e164 = toE164(body.phone);
  if (!e164) return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });

  try {
    const result = await startVerification(e164);
    // Stage the pending number on the user row (not yet verified).
    await supabase
      .from('users')
      .update({ phone: e164, phone_verified: false })
      .eq('id', user.id);
    return NextResponse.json({ status: result.status, phone: e164 });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? 'Failed to send code' },
      { status: 500 },
    );
  }
}
