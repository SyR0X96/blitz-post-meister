
import React from "react";
import FeatureCard from "./FeatureCard";
import { MessageSquareCode, TrendingUp, Check } from "lucide-react";

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-16 px-4" id="features">
      <div className="container mx-auto">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-4">
          Warum <span className="text-orange-500">Greven Medien</span>?
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Unsere Plattform bietet einzigartige Vorteile für Ihre Social-Media-Strategie
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<MessageSquareCode />}
            title="KI-generierte Inhalte"
            description="Erstklassige Inhalte durch fortschrittliche KI-Modelle wie GPT und Claude - maßgeschneidert für jede Plattform."
          />
          <FeatureCard
            icon={<TrendingUp />}
            title="Trendrecherche"
            description="Automatisierte Recherche über Google und Perplexity, um immer relevante und aktuelle Inhalte zu liefern."
          />
          <FeatureCard
            icon={<Check />}
            title="DSGVO-konform"
            description="Alle Prozesse entsprechen den strengen europäischen Datenschutzrichtlinien für maximale Sicherheit."
          />
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Optimiert für alle gängigen sozialen Netzwerke
          </p>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
