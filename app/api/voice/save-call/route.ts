import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      durationSeconds = 30,
      transcript = [],
      callerPhone = '+919876543210',
      leadDetails = {},
      summary = 'In-browser voice interaction completed.',
      language = 'hi',
    } = body;

    const supabase = createServiceClient();

    // 1. Get current business and agent
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: 'No business configured' }, { status: 400 });
    }

    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('business_id', business.id)
      .limit(1)
      .maybeSingle();

    const agentId = agent?.id ?? '22222222-2222-2222-2222-222222222222';

    // 2. Insert call record
    const { data: callRow, error: callErr } = await supabase
      .from('calls')
      .insert({
        agent_id: agentId,
        business_id: business.id,
        caller_phone: callerPhone,
        duration_seconds: durationSeconds,
        transcript: transcript.map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'agent',
          text: m.text,
        })),
        language_detected: language,
        summary: summary,
        status: 'completed',
      })
      .select('id')
      .single();

    if (callErr || !callRow) {
      console.error('Failed to save call in Supabase:', callErr);
      return NextResponse.json({ error: callErr?.message }, { status: 500 });
    }

    // 3. Insert lead record if customer name / slot / service mentioned
    if (leadDetails.name || leadDetails.service || leadDetails.slot) {
      await supabase.from('leads').insert({
        call_id: callRow.id,
        business_id: business.id,
        customer_name: leadDetails.name || 'Website Visitor',
        customer_phone: callerPhone,
        intent: leadDetails.slot ? 'book_appointment' : 'pricing_enquiry',
        lead_score: leadDetails.score || (leadDetails.slot ? 9 : 7),
        sentiment: 'positive',
        follow_up_action: leadDetails.slot
          ? `Appointment booked for ${leadDetails.slot}. Send WhatsApp confirmation.`
          : 'Send services brochure on WhatsApp.',
        status: leadDetails.slot ? 'won' : 'new',
        notes: `Service: ${leadDetails.service || 'General Inquiry'}. Captured via In-Browser Voice Assistant.`,
      });
    }

    return NextResponse.json({ success: true, callId: callRow.id });
  } catch (error: any) {
    console.error('Error saving voice call:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
