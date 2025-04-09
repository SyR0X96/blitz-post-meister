
import React from "react";
import ProcessStep from "./ProcessStep";
import TechLogo from "./TechLogo";
import { Cloud, MessageSquare, Check } from "lucide-react";

const TechnologySection: React.FC = () => {
  return (
    <section className="py-16 px-4 bg-secondary/30" id="technology">
      <div className="container mx-auto">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-4">
          Unsere <span className="text-orange-500">Technologie</span>
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Moderne KI-Architektur für perfekte Social-Media-Beiträge
        </p>

        {/* Process Steps */}
        <div className="glass-card p-8 rounded-2xl mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <ProcessStep 
              icon={<Cloud />}
              title="Daten sammeln"
            />
            <ProcessStep 
              icon={<MessageSquare />}
              title="KI-Verarbeitung"
            />
            <ProcessStep 
              icon={<Check />}
              title="Fertiger Post"
              isLast
            />
          </div>
        </div>

        {/* Tech Logos */}
        <h3 className="text-xl text-center mb-8">Unterstützt durch führende KI-Systeme</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
          <TechLogo 
            name="ChatGPT" 
            logo={
              <div className="w-10 h-10 rounded-full bg-[#10A37F] flex items-center justify-center">
                <span className="text-white font-bold text-xs">GPT</span>
              </div>
            }
          />
          <TechLogo 
            name="Claude" 
            logo={
              <div className="w-10 h-10 rounded-full bg-[#8C5BDD] flex items-center justify-center">
                <span className="text-white font-bold text-xs">CA</span>
              </div>
            }
          />
          <TechLogo 
            name="Google" 
            logo={
              <div className="w-10 h-10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.5 12c0-.786-.07-1.557-.202-2.302H12v4.35h5.876c-.26 1.358-1.035 2.512-2.202 3.285v2.713h3.567c2.09-1.925 3.29-4.76 3.29-8.046z" fill="#4285F4" />
                  <path d="M12 23c2.977 0 5.478-.99 7.304-2.668l-3.567-2.713c-.99.66-2.252 1.05-3.737 1.05-2.874 0-5.306-1.933-6.177-4.527H2.17v2.802C3.99 20.456 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.823 14.142c-.225-.66-.352-1.367-.352-2.09 0-.723.127-1.43.352-2.09V7.16H2.17a11.087 11.087 0 000 9.798l3.653-2.816z" fill="#FBBC05" />
                  <path d="M12 5.495c1.62 0 3.075.55 4.216 1.62l3.156-3.156C17.455 2.156 14.955 1 12 1 7.7 1 3.99 3.544 2.17 7.156l3.653 2.817C6.695 7.428 9.127 5.495 12 5.495z" fill="#EA4335" />
                </svg>
              </div>
            }
          />
          <TechLogo 
            name="Perplexity" 
            logo={
              <div className="w-10 h-10 rounded-full bg-[#5540af] flex items-center justify-center">
                <span className="text-white font-bold text-xs">P</span>
              </div>
            }
          />
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;
