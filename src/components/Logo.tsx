
import React from "react";

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`font-bold text-orange-500 ${className}`}>
      <span className="text-white">Greven</span>Medien
    </div>
  );
};

export default Logo;
