
import React from "react";
import Button from "./Button";
import Logo from "./Logo";
import SocialIcons from "./SocialIcons";

const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center px-4 py-16">
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/40 z-0"></div>

      {/* Watermark logo */}
      <Logo className="absolute opacity-5 text-7xl transform scale-150" />

      {/* Content */}
      <div className="container mx-auto text-center z-10 max-w-3xl">
        <Logo className="text-3xl lg:text-4xl mb-6 inline-block" />
        
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-balance">
          „Erhalte in Sekunden deinen perfekten Social-Media-Post – 
          <span className="text-orange-500"> vollautomatisch & authentisch</span>"
        </h1>

        <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          Erstelle professionelle Beiträge für alle sozialen Medien mit Hilfe modernster KI-Technologie.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button size="lg">Jetzt Post schreiben</Button>
          <Button variant="secondary" size="lg">Mehr erfahren</Button>
        </div>

        <SocialIcons />
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="text-orange-500"
        >
          <path 
            d="M12 5L12 19M12 19L19 12M12 19L5 12" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
