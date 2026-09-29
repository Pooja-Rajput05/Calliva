import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `
You are Priya, the smart, warm, and highly efficient AI Receptionist for "Sharma Dental Clinic" (owned by Dr. Vivek Sharma).

CLINIC INFORMATION:
- Doctor: Dr. Vivek Sharma (BDS, MDS - 12+ years experience)
- Services: Dental Consultation, Root Canal Treatment (RCT), Teeth Whitening & Cleaning, Braces & Aligners, Tooth Extraction, Dental Implants, Pain Relief.
- Fees: Consultation fee is ₹500. Exact procedure cost is advised by doctor after checkup.
- Timings: Mon–Sat (10:00 AM – 8:30 PM), Sunday (10:00 AM – 2:00 PM).
- Location: Sector 14, Main Market, Delhi NCR.

RULES FOR YOUR VOICE REPLIES:
1. You are speaking over a phone call. Keep EVERY reply CONCISE (1 to 2 sentences max). Do NOT write bullet points or markdown.
2. Multilingual: If the user speaks in Hindi or Hinglish, reply in warm Hinglish/Hindi. If they speak English, reply in English.
3. Natural Phone Manner: Be extremely polite, professional, and helpful. Use phrases like "Namaste", "Ji bilkul", "Sure!", "Main note kar leti hoon".
4. Booking Flow: When a patient asks for an appointment or checkup:
   - Step 1: Offer available time slots (e.g. "Kal shaam 4:30 PM ya 6:00 PM available hai. Aapko kaun sa time theek rahega?").
   - Step 2: Once they confirm time, ask for their full name if not known.
   - Step 3: Confirm the booking and mention WhatsApp confirmation is sent.

OUTPUT FORMAT:
Always return your response as valid JSON matching this exact structure:
{
  "reply": "Spoken text that AI will say to the user",
  "toolAction": "check_availability" | "book_appointment" | "get_business_info" | "none",
  "intent": "booking" | "inquiry" | "pricing" | "emergency" | "general",
  "leadScore": 9.5,
  "detectedSlot": "Tomorrow 6:00 PM",
  "patientName": "Rohit"
}
`;

function cleanAndParseJSON(raw: string) {
  if (!raw) return null;
  try {
    // Remove markdown ```json code blocks
    let cleaned = raw.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '');
    }
    return JSON.parse(cleaned.trim());
  } catch (e) {
    console.warn('Failed to parse JSON directly:', e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userMessage, history = [] } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'mock_gemini_key') {
      return NextResponse.json(getSimulatedResponse(userMessage));
    }

    // Build conversation context for Gemini
    const contents: any[] = [
      {
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: 'model',
        parts: [
          {
            text: JSON.stringify({
              reply:
                'Namaste! Sharma Dental Clinic me aapka swagat hai. Main AI receptionist Priya bol rahi hoon. Main aapki kya madad kar sakti hoon?',
              toolAction: 'none',
              intent: 'general',
              leadScore: 5,
              detectedSlot: null,
              patientName: null,
            }),
          },
        ],
      },
    ];

    // Append past turns
    for (const msg of history) {
      contents.push({
        role: msg.sender === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.text }],
      });
    }

    // Append latest user message
    contents.push({
      role: 'user',
      parts: [
        {
          text: `User just said: "${userMessage}". Output ONLY valid JSON matching the specified format.`,
        },
      ],
    });

    // Call Google Gemini API (Gemini 2.0 Flash / Gemini 1.5 Flash)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      // Fallback to gemini-1.5-flash
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!fallbackRes.ok) {
        console.warn('Gemini API call failed, using graceful fallback');
        return NextResponse.json(getSimulatedResponse(userMessage));
      }

      const fallbackData = await fallbackRes.json();
      const rawText = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = cleanAndParseJSON(rawText);
      return NextResponse.json(parsed || getSimulatedResponse(userMessage));
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = cleanAndParseJSON(rawText);
    return NextResponse.json(parsed || getSimulatedResponse(userMessage));
  } catch (error: any) {
    console.error('Error in /api/voice/chat:', error);
    return NextResponse.json(getSimulatedResponse(''));
  }
}

function getSimulatedResponse(userText: string) {
  const lower = userText.toLowerCase();

  if (
    lower.includes('appointment') ||
    lower.includes('book') ||
    lower.includes('milna') ||
    lower.includes('checkup') ||
    lower.includes('daant') ||
    lower.includes('pain')
  ) {
    return {
      reply:
        'Dr. Sharma kal clinic me available hain. Kal shaam 4:30 PM aur 6:00 PM ke slots khali hain. Aapko kaun sa samay theek rahega?',
      toolAction: 'check_availability',
      intent: 'booking',
      leadScore: 8.5,
      detectedSlot: 'Tomorrow 4:30 PM / 6:00 PM',
      patientName: null,
    };
  }

  if (
    lower.includes('4') ||
    lower.includes('6') ||
    lower.includes('shaam') ||
    lower.includes('evening') ||
    lower.includes('confirm')
  ) {
    return {
      reply:
        'Bohat badhiya! Aapka appointment kal shaam 6:00 PM Dr. Sharma ke sath confirm ho gaya hai. Humne aapke number par WhatsApp confirmation bhej diya hai.',
      toolAction: 'book_appointment',
      intent: 'booking',
      leadScore: 9.8,
      detectedSlot: 'Tomorrow 6:00 PM',
      patientName: 'Verified Patient',
    };
  }

  if (
    lower.includes('price') ||
    lower.includes('fee') ||
    lower.includes('cost') ||
    lower.includes('kitna') ||
    lower.includes('charge')
  ) {
    return {
      reply:
        'Initial dental checkup aur consultation fees ₹500 hai. Root canal aur cleaning ke charges checkup ke baad doctor batayenge.',
      toolAction: 'get_business_info',
      intent: 'pricing',
      leadScore: 7.2,
      detectedSlot: null,
      patientName: null,
    };
  }

  return {
    reply:
      'Ji bilkul! Sharma Dental Clinic me Root Canal, Teeth Cleaning aur Regular Checkup ki sabhi suvidhayein uplabdh hain. Kya aap Dr. Sharma ke sath appointment schedule karna chahte hain?',
    toolAction: 'get_business_info',
    intent: 'inquiry',
    leadScore: 6.5,
    detectedSlot: null,
    patientName: null,
  };
}
