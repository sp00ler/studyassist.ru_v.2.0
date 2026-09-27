'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { UrgencyBar } from '@/components/layout/UrgencyBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BrowserChrome } from '@/components/layout/BrowserChrome'
import { RetroGate } from '@/components/home/RetroGate'
import { StatsSection } from '@/components/home/StatsSection'
import { ServicesSection } from '@/components/home/ServicesSection'
import { HowItWorks } from '@/components/home/HowItWorks'
import { PricingSection } from '@/components/home/PricingSection'
import { ReviewsSection } from '@/components/home/ReviewsSection'
import { OrderForm } from '@/components/home/OrderForm'
import { FaqSection } from '@/components/home/FaqSection'
import type { ReactNode } from 'react'

// The monitor screen's center in room-scene.png, as % of the image — the zoom
// transition scales up from this point so it reads as "the screen fills the view".
const MONITOR_ORIGIN = '31.4% 35%'

type Phase = 'gate' | 'entering' | 'site'

type HomeExperienceProps = {
  portfolioSection: ReactNode
  blogSection: ReactNode
}

export function HomeExperience({ portfolioSection, blogSection }: HomeExperienceProps) {
  const [phase, setPhase] = useState<Phase>('gate')

  return (
    <>
      {phase !== 'site' && (
        // ponytail: no AnimatePresence here on purpose — it raced React's own
        // unmount (setPhase('site') fires from onAnimationComplete, same tick
        // AnimatePresence tries to run its own exit-removal) and threw
        // "removeChild: node is not a child of this node". The scale/opacity
        // animate() already reads as "gone" by the time this unmounts, so a
        // plain conditional render is correct, not a downgrade.
        <motion.div
          className="fixed inset-0 z-20"
          style={{ transformOrigin: MONITOR_ORIGIN }}
          initial={{ scale: 1, opacity: 1 }}
          animate={
            phase === 'entering'
              ? { scale: 8, opacity: 0 }
              : { scale: 1, opacity: 1 }
          }
          transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
          onAnimationComplete={() => {
            if (phase === 'entering') setPhase('site')
          }}
        >
          <RetroGate onEnter={() => setPhase('entering')} />
        </motion.div>
      )}

      {phase === 'site' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
        >
          <BrowserChrome onHome={() => setPhase('gate')}>
            <UrgencyBar />
            <Navbar />
            <main id="main-content">
              <StatsSection />
              <ServicesSection />
              <HowItWorks />
              <PricingSection />
              <ReviewsSection />
              {portfolioSection}
              {blogSection}
              <OrderForm />
              <FaqSection />
            </main>
            <Footer />
          </BrowserChrome>
        </motion.div>
      )}
    </>
  )
}
