import React from 'react';
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/Theme"; // Adjusted path from "@/components/Theme"

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const effectiveTheme = theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme;

  const toggleTheme = () => {
    if (effectiveTheme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <div
      className="relative flex items-center p-1 rounded-full bg-gray-700 w-20 h-10 cursor-pointer overflow-hidden"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      role="switch"
      aria-checked={effectiveTheme === 'dark'}
    >
      <div
        className={`
          absolute top-1 left-1 w-9 h-8 bg-gray-400 rounded-full shadow-md
          transition-transform duration-300 ease-in-out
          ${effectiveTheme === 'dark' ? 'translate-x-[36px]' : 'translate-x-0'}
        `}
      ></div>

      <div className="flex-1 flex justify-center items-center z-10">
        <Sun
          className={`
            h-4 w-4 transition-colors duration-300
            ${effectiveTheme === 'light' ? 'text-gray-100' : 'text-gray-400'}
          `}
          aria-hidden="true"
        />
      </div>

      <div className="flex-1 flex justify-center items-center z-10">
        <Moon
          className={`
            h-4 w-4 transition-colors duration-300
            ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-400'}
          `}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export default ModeToggle;