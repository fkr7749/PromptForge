import Navigation from '@/components/layout/Navigation'
import HeroSection from '@/components/sections/HeroSection'
import FeaturesSection from '@/components/sections/FeaturesSection'
import StatsSection from '@/components/sections/StatsSection'
import PlaygroundPreviewSection from '@/components/sections/PlaygroundPreviewSection'
import HowItWorksSection from '@/components/sections/HowItWorksSection'
import TestimonialsSection from '@/components/sections/TestimonialsSection'
import PricingSection from '@/components/sections/PricingSection'
import CTASection from '@/components/sections/CTASection'
import Footer from '@/components/layout/Footer'

export default function HomePage() {
  return (
    <>
      <Navigation />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <PlaygroundPreviewSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </>
  )
}
