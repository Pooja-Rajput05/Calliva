-- ============================================================================
-- Calliva AI Receptionist — Full Database Schema + Demo Seed Data
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. TABLE: businesses
CREATE TABLE IF NOT EXISTS public.businesses (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id    TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  owner_phone      TEXT,
  owner_whatsapp   TEXT,
  language         TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi', 'ta', 'te')),
  website_url      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLE: agents
CREATE TABLE IF NOT EXISTS public.agents (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id            UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  elevenlabs_agent_id    TEXT UNIQUE,
  elevenlabs_voice_id    TEXT,
  twilio_number_sid      TEXT UNIQUE,
  twilio_phone_e164      TEXT UNIQUE,
  status                 TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('provisioning', 'active', 'paused', 'failed')),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABLE: subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id             UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT NOT NULL UNIQUE,
  stripe_subscription_id  TEXT UNIQUE,
  tier                    TEXT NOT NULL CHECK (tier IN ('starter', 'growth', 'scale')),
  status                  TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'paused')),
  current_period_end      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABLE: knowledge_base
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  source_url    TEXT NOT NULL,
  content       TEXT NOT NULL,
  embedded_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TABLE: calls
CREATE TABLE IF NOT EXISTS public.calls (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id                    UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  business_id                 UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  elevenlabs_conversation_id  TEXT UNIQUE,
  caller_phone                TEXT,
  duration_seconds            INT NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  transcript                  JSONB,
  audio_url                   TEXT,
  language_detected           TEXT,
  summary                     TEXT,
  status                      TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'failed')),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. TABLE: leads
CREATE TABLE IF NOT EXISTS public.leads (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id             UUID REFERENCES public.calls(id) ON DELETE SET NULL,
  business_id         UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_name       TEXT,
  customer_phone      TEXT,
  customer_email      TEXT,
  intent              TEXT,
  lead_score          INT NOT NULL DEFAULT 0 CHECK (lead_score BETWEEN 0 AND 10),
  sentiment           TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'angry')),
  follow_up_action    TEXT,
  status              TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'won', 'lost')),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. TABLE: meter_events
CREATE TABLE IF NOT EXISTS public.meter_events (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id           UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  business_id       UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  stripe_event_id   TEXT NOT NULL UNIQUE,
  minutes_billed    INT NOT NULL CHECK (minutes_billed >= 0),
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Helper Functions
CREATE OR REPLACE FUNCTION public.current_clerk_user_id()
RETURNS TEXT LANGUAGE SQL STABLE AS $$
  SELECT coalesce(auth.jwt() ->> 'sub', 'user_demo')::TEXT;
$$;

CREATE OR REPLACE FUNCTION public.current_business_id()
RETURNS UUID LANGUAGE SQL STABLE AS $$
  SELECT id FROM public.businesses LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.business_minutes_used_this_period(p_business_id UUID)
RETURNS INT LANGUAGE SQL STABLE AS $$
  SELECT coalesce(sum(minutes_billed), 0)::INT
  FROM public.meter_events
  WHERE business_id = p_business_id
    AND sent_at >= date_trunc('month', now());
$$;

-- 11. Enable Row Level Security (RLS) with permissive access for demo
ALTER TABLE public.businesses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_events   ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon + authenticated (suitable for free portfolio demo)
CREATE POLICY "Public Read Businesses" ON public.businesses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Agents" ON public.agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Subscriptions" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Knowledge" ON public.knowledge_base FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Calls" ON public.calls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Meter" ON public.meter_events FOR ALL USING (true) WITH CHECK (true);

-- 12. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agents;

-- 13. Seed Demo Data
INSERT INTO public.businesses (
  id,
  clerk_user_id,
  name,
  owner_phone,
  owner_whatsapp,
  language,
  website_url
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'user_demo',
  'Calliva Care Clinic',
  '+919876543210',
  '+919876543210',
  'hi',
  'https://calliva.ai'
)
ON CONFLICT (clerk_user_id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.agents (
  id,
  business_id,
  elevenlabs_agent_id,
  elevenlabs_voice_id,
  twilio_number_sid,
  twilio_phone_e164,
  status
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'agent_calliva_demo',
  'voice_calliva_hi',
  'PNdemo000000000000000000000000calliva',
  '+918047111222',
  'active'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subscriptions (
  id,
  business_id,
  stripe_customer_id,
  stripe_subscription_id,
  tier,
  status,
  current_period_end
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'cus_demo_calliva',
  'sub_demo_calliva',
  'growth',
  'active',
  now() + interval '30 days'
)
ON CONFLICT (stripe_customer_id) DO NOTHING;

INSERT INTO public.knowledge_base (
  id,
  business_id,
  source_url,
  content,
  embedded_at
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'https://calliva.ai/services',
  'Calliva Care Clinic offers Root Canal, Dental Scaling, Braces & Aligners, and General Checkups. Clinic timings: Monday to Saturday from 10:00 AM to 7:00 PM. Closed on Sundays.',
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.calls (
  id,
  agent_id,
  business_id,
  elevenlabs_conversation_id,
  caller_phone,
  duration_seconds,
  language_detected,
  summary,
  status,
  transcript,
  created_at
) VALUES
  (
    '55555555-5555-5555-5555-555555555551',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'conv_demo_001',
    '+919900223344',
    142,
    'hi',
    'Caller inquired about teeth scaling and booked an appointment for Thursday 4 PM.',
    'completed',
    '[{"role":"agent","text":"Namaste, Calliva Care Clinic mein aapka swagat hai. Kaise madad kar sakti hu?"},{"role":"user","text":"Hello, mujhe teeth scaling ke baare me puchna tha aur appointment lena hai."},{"role":"agent","text":"Bilkul! Thursday 4 PM ka slot available hai. Kya main aapka slot book kar doon?"},{"role":"user","text":"Haan please book kar dijiye."}]'::jsonb,
    now() - interval '3 hours'
  ),
  (
    '55555555-5555-5555-5555-555555555552',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'conv_demo_002',
    '+919811556677',
    87,
    'en',
    'Caller inquired about invisible braces cost and asked for doctor consultation slot.',
    'completed',
    '[{"role":"agent","text":"Hello, thank you for calling Calliva Care Clinic. How can I help you today?"},{"role":"user","text":"Hi, what is the cost of invisible aligners?"},{"role":"agent","text":"Aligners start from ₹45,000 depending on scan analysis. Would you like a consultation scheduled?"}]'::jsonb,
    now() - interval '1 hour'
  ),
  (
    '55555555-5555-5555-5555-555555555553',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'conv_demo_003',
    '+919833779900',
    45,
    'hi',
    'Live test voice call via web browser.',
    'completed',
    '[{"role":"agent","text":"Namaste! Main Calliva AI receptionist hu. Main aapki kya sahayata kar sakti hu?"},{"role":"user","text":"Clinic kab tak open rehta hai?"},{"role":"agent","text":"Hamara clinic Monday se Saturday subah 10 baje se shaam 7 baje tak khula rehta hai."}]'::jsonb,
    now() - interval '15 minutes'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.leads (
  id,
  call_id,
  business_id,
  customer_name,
  customer_phone,
  customer_email,
  intent,
  lead_score,
  sentiment,
  follow_up_action,
  status,
  notes
) VALUES
  (
    '66666666-6666-6666-6666-666666666661',
    '55555555-5555-5555-5555-555555555551',
    '11111111-1111-1111-1111-111111111111',
    'Anjali Verma',
    '+919900223344',
    'anjali.verma@example.com',
    'book_appointment',
    9,
    'positive',
    'Send WhatsApp reminder 24h before Thursday 4pm slot.',
    'won',
    'Confirmed scaling appointment for Thursday 4:00 PM.'
  ),
  (
    '66666666-6666-6666-6666-666666666662',
    '55555555-5555-5555-5555-555555555552',
    '11111111-1111-1111-1111-111111111111',
    'Rohit Mehra',
    '+919811556677',
    'rohit.mehra@example.com',
    'pricing_enquiry',
    7,
    'neutral',
    'Send aligners brochure on WhatsApp and schedule Dr consultation.',
    'new',
    'Inquired about invisible braces and financing options.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.meter_events (
  id,
  call_id,
  business_id,
  stripe_event_id,
  minutes_billed
) VALUES (
  '77777777-7777-7777-7777-777777777771',
  '55555555-5555-5555-5555-555555555551',
  '11111111-1111-1111-1111-111111111111',
  'evt_demo_call_001',
  3
)
ON CONFLICT (stripe_event_id) DO NOTHING;
