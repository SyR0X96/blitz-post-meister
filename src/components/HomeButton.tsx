
import React from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const HomeButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate("/")}
      className="fixed top-4 left-4 z-50 bg-secondary/50 hover:bg-secondary text-white"
      aria-label="Home"
    >
      <Home className="h-5 w-5" />
    </Button>
  );
};

export default HomeButton;
