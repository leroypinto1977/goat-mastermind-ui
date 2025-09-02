"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CodeInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CodeInput({ 
  length, 
  value, 
  onChange, 
  disabled = false, 
  className 
}: CodeInputProps) {
  const [codes, setCodes] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Update codes when value prop changes
    const newCodes = value.split("").concat(Array(length).fill("")).slice(0, length);
    setCodes(newCodes);
  }, [value, length]);

  const handleChange = (index: number, inputValue: string) => {
    if (disabled) return;

    // Only allow single digit
    const digit = inputValue.replace(/\D/g, "").slice(-1);
    
    const newCodes = [...codes];
    newCodes[index] = digit;
    setCodes(newCodes);
    
    // Update parent component
    onChange(newCodes.join(""));

    // Auto focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      
      const newCodes = [...codes];
      
      if (codes[index]) {
        // Clear current input if it has a value
        newCodes[index] = "";
        setCodes(newCodes);
        onChange(newCodes.join(""));
      } else if (index > 0) {
        // Move to previous input and clear it
        newCodes[index - 1] = "";
        setCodes(newCodes);
        onChange(newCodes.join(""));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "Delete") {
      e.preventDefault();
      const newCodes = [...codes];
      newCodes[index] = "";
      setCodes(newCodes);
      onChange(newCodes.join(""));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    
    if (pastedData) {
      const newCodes = pastedData.split("").concat(Array(length).fill("")).slice(0, length);
      setCodes(newCodes);
      onChange(newCodes.join(""));
      
      // Focus the next empty input or the last input
      const nextEmptyIndex = newCodes.findIndex(code => !code);
      const focusIndex = nextEmptyIndex === -1 ? length - 1 : Math.min(nextEmptyIndex, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    // Select all text when focusing
    inputRefs.current[index]?.select();
  };

  return (
    <div className={cn("flex gap-3 justify-center", className)}>
      {codes.map((code, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={code}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={cn(
            "w-12 h-14 text-center text-xl font-bold rounded-lg border-2 transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-goat-brown focus:border-goat-brown",
            "hover:border-goat-brown/50",
            disabled && "opacity-50 cursor-not-allowed",
            code ? "border-goat-brown bg-goat-brown/5" : "border-border",
            "dark:bg-background dark:text-foreground",
            "placeholder:text-muted-foreground/50"
          )}
          maxLength={1}
          autoComplete="off"
        />
      ))}
    </div>
  );
}
