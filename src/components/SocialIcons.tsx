
import React from "react";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

const SocialIcons: React.FC = () => {
  return (
    <div className="flex space-x-4 justify-center">
      <div className="glass-card p-2 rounded-full">
        <Linkedin className="text-[#0A66C2]" size={20} />
      </div>
      <div className="glass-card p-2 rounded-full">
        <Facebook className="text-[#1877F2]" size={20} />
      </div>
      <div className="glass-card p-2 rounded-full">
        <Instagram className="text-[#E4405F]" size={20} />
      </div>
      <div className="glass-card p-2 rounded-full">
        <Twitter className="text-[#1DA1F2]" size={20} />
      </div>
    </div>
  );
};

export default SocialIcons;
