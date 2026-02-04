"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn("w-full justify-start", className)}
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800/50 mr-3">
          <Sun className="w-5 h-5" />
        </div>
        <span>Tema</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "w-full justify-start text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300 group",
        className
      )}
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800/50 group-hover:bg-slate-700/50 transition-all duration-300 mr-3">
        {theme === "dark" ? (
          <Moon className="w-5 h-5 text-blue-400" />
        ) : (
          <Sun className="w-5 h-5 text-yellow-400" />
        )}
      </div>
      <span className="flex-1 text-left">
        {theme === "dark" ? "Karanlık Tema" : "Aydınlık Tema"}
      </span>
    </Button>
  );
}
