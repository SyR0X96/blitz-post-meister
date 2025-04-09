
import React from "react";
import Logo from "./Logo";

const Footer: React.FC = () => {
  return (
    <footer className="py-8 px-4 border-t border-white/10">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <Logo className="mb-4 md:mb-0" />
          
          <div className="text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Greven Medien GmbH. Alle Rechte vorbehalten.</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a href="#" className="text-muted-foreground hover:text-orange-500 text-sm">
              Impressum
            </a>
            <a href="#" className="text-muted-foreground hover:text-orange-500 text-sm">
              Datenschutz
            </a>
            <a href="#" className="text-muted-foreground hover:text-orange-500 text-sm">
              AGB
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
