import { BentoFeatures } from '@/components/landing/bento-features';
import { FaqAccordion } from '@/components/landing/faq-accordion';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { MarketingFooter } from '@/components/landing/marketing-footer';
import { MarketingNavbar } from '@/components/landing/marketing-navbar';
import { BlurFade } from '@/components/ui/blur-fade';

/**
 * Voxa marketing landing.
 *
 * Clean portfolio landing page featuring Hero with In-Browser Voice AI Demo,
 * How It Works (About), Bento Features, FAQ, and Footer.
 */
export default function HomePage() {
  return (
    <main className="voxa-bg-light dark:voxa-bg-dark min-h-screen w-full">
      <MarketingNavbar />
      <Hero />

      <BlurFade inView delay={0.0} offset={12}>
        <HowItWorks />
      </BlurFade>

      <BlurFade inView delay={0.1} offset={12}>
        <BentoFeatures />
      </BlurFade>

      <BlurFade inView delay={0.2} offset={12}>
        <FaqAccordion />
      </BlurFade>

      <MarketingFooter />
    </main>
  );
}
