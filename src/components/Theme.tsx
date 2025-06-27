import React, { createContext, useContext, useEffect, useState } from "react";

// Define the shape of the theme context
interface ThemeProviderState {
  theme: "dark" | "light" | "system";
  setTheme: (theme: "dark" | "light" | "system") => void;
}

// Create the context with a default undefined value
const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
  undefined
);

// Props for the ThemeProvider component
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: "dark" | "light" | "system";
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  // State to hold the current theme
  const [theme, setThemeState] = useState<"dark" | "light" | "system">(() => {
    // Read theme from localStorage or default to system
    const storedTheme = localStorage.getItem(storageKey);
    if (storedTheme) {
      return (storedTheme as "dark" | "light" | "system");
    }
    return defaultTheme;
  });

  // Effect to apply the theme class to the HTML element
  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark"); // Remove existing classes

    if (theme === "system") {
      // Determine system preference
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme); // Apply system theme
    } else {
      root.classList.add(theme); // Apply selected theme (dark or light)
    }
  }, [theme]); // Re-run effect when theme changes

  // Function to update the theme state and localStorage
  const setTheme = (theme: "dark" | "light" | "system") => {
    localStorage.setItem(storageKey, theme);
    setThemeState(theme);
  };

  // Context value to be provided to children
  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// Custom hook to consume the theme context
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};