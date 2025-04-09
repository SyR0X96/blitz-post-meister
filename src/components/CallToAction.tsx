
import React from "react";
import Button from "./Button";
import SocialIcons from "./SocialIcons";

const CallToAction: React.FC = () => {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto text-center">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6">
          Bereit für perfekte <span className="text-orange-500">Social-Media-Posts</span>?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          Erstellen Sie jetzt Ihren ersten Post und überzeugen Sie sich von der Qualität unserer KI-generierten Inhalte.
        </p>
        
        <Button size="lg">Jetzt Post schreiben</Button>
        
        <div className="mt-12">
          <SocialIcons />
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
