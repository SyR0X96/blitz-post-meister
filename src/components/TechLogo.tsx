
import React from "react";
import { cn } from "@/lib/utils";

interface TechLogoProps {
  name: string;
  logo: React.ReactNode;
  className?: string;
}

const TechLogo: React.FC<TechLogoProps> = ({ name, logo, className }) => {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="glass-card p-3 rounded-full mb-2 animate-pulse-glow">
        {logo}
      </div>
      <span className="text-sm text-muted-foreground">{name}</span>
    </div>
  );
};

export default TechLogo;
