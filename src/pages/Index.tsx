
import React from 'react';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import TechnologySection from '@/components/TechnologySection';
import CallToAction from '@/components/CallToAction';
import Footer from '@/components/Footer';

const Index = () => {
  // Set dark mode as default for the page
  React.useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = '#1A1F2C';
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection />
      <FeaturesSection />
      <TechnologySection />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Index;
