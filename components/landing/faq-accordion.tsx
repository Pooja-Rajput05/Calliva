'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

/**
 * FAQ accordion component for Calliva.
 */

interface FaqEntry {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}

const FAQ: ReadonlyArray<FaqEntry> = [
  {
    id: 'setup',
    question: 'How does Calliva work for reception and calls?',
    answer:
      "Calliva uses real-time conversational voice AI to attend customer inquiries. It auto-detects language, checks your live availability slots, and books appointments seamlessly.",
  },
  {
    id: 'languages',
    question: 'What languages does Calliva support?',
    answer:
      "Calliva auto-detects and switches between Hindi, Tamil, Telugu, and English mid-call. Callers can speak naturally in their preferred language, and the AI matches their dialect.",
  },
  {
    id: 'calendar',
    question: 'Can the AI book appointments into my existing calendar?',
    answer:
      "Yes. Calliva books directly into your Cal.com calendar via real-time tool calls during the voice conversation, avoiding double-bookings.",
  },
  {
    id: 'demo',
    question: 'Is this live interactive demo free to test?',
    answer:
      "Yes! You can click the 'Start Live Voice Call' button right on this page to test talking to Calliva using your device microphone with zero setup required.",
  },
  {
    id: 'clone',
    question: 'Can the AI speak in a custom cloned voice?',
    answer:
      "Absolutely. With instant voice cloning, a 60-second audio sample allows the receptionist to answer customer inquiries in your exact voice.",
  },
];

export function FaqAccordion() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="relative w-full px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            Frequently asked
          </p>
          <h2
            id="faq-heading"
            className="mt-3 font-display text-3xl tracking-tight text-slate-950 sm:text-4xl dark:text-slate-50"
          >
            Got Questions? We’ve Got Answers.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-balance text-sm text-slate-600 sm:text-base dark:text-slate-300">
            Everything you need to know about Calliva’s multilingual voice intelligence.
          </p>
        </div>

        <div className="mt-12">
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((entry) => (
              <AccordionItem key={entry.id} value={entry.id}>
                <AccordionTrigger className="text-left text-base font-semibold text-slate-900 dark:text-slate-100">
                  {entry.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {entry.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
