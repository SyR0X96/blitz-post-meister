
import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "default" | "sm" | "lg";
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "default",
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        variant === "primary"
          ? "bg-orange-500 text-white hover:bg-orange-600"
          : "bg-secondary text-white hover:bg-secondary/80",
        size === "default"
          ? "h-10 px-4 py-2"
          : size === "sm"
          ? "h-8 px-3 py-1 text-sm"
          : "h-12 px-6 py-3 text-lg",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
