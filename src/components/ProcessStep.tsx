
import React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface ProcessStepProps {
  icon: React.ReactNode;
  title: string;
  isLast?: boolean;
  className?: string;
}

const ProcessStep: React.FC<ProcessStepProps> = ({
  icon,
  title,
  isLast = false,
  className,
}) => {
  return (
    <div className={cn("flex items-center", className)}>
      <div className="glass-card p-4 rounded-full">
        <div className="text-orange-500 text-2xl">{icon}</div>
      </div>
      <div className="ml-4 text-lg font-medium">{title}</div>
      {!isLast && (
        <ChevronRight className="mx-4 text-orange-500 animate-flow-right" size={24} />
      )}
    </div>
  );
};

export default ProcessStep;
