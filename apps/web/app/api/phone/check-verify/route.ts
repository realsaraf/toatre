import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { checkVerification } from '@/lib/twilio';

export const runtime = 'nodejs';

const Body = z.object({
  phone: z.string().min(5).max(30),
  code: z.string().min(4).max(10),
});

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

  try {
    const result = await checkVerification(body.phone, body.code);
    if (!result.valid) {
      return NextResponse.json({ valid: false, status: result.status }, { status: 400 });
    }
    await supabase
      .from('users')
      .update({ phone: body.phone, phone_verified: true })
      .eq('id', user.id);
    return NextResponse.json({ valid: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? 'Failed to verify code' },
      { status: 500 },
    );
  }
}
