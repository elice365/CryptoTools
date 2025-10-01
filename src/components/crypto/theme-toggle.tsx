"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, MoonStar, Sun, Monitor, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const t = useTranslations("theme");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("label")}
        className="relative"
        disabled
      >
        <Loader2 className="size-4 animate-spin" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("label")}
          className="relative transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
        >
          <Sun
            className={`size-4 transition-all duration-300 ${isDark ? "-rotate-90 scale-0" : "rotate-0 scale-100"}`}
          />
          <MoonStar
            className={`absolute inset-0 m-auto size-4 transition-all duration-300 ${isDark ? "rotate-0 scale-100" : "rotate-90 scale-0"}`}
          />
          <span className="sr-only">{t("toggle")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[200px] shadow-lg border-border/50 backdrop-blur-sm"
        sideOffset={5}
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center justify-between cursor-pointer transition-colors duration-200 hover:bg-accent/80"
        >
          <div className="flex items-center gap-3">
            <Sun className="size-4 text-amber-500" />
            <span className="font-medium">{t("light")}</span>
          </div>
          {theme === "light" && (
            <Check className="size-4 text-primary animate-in fade-in-50 duration-200" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center justify-between cursor-pointer transition-colors duration-200 hover:bg-accent/80"
        >
          <div className="flex items-center gap-3">
            <MoonStar className="size-4 text-blue-500" />
            <span className="font-medium">{t("dark")}</span>
          </div>
          {theme === "dark" && (
            <Check className="size-4 text-primary animate-in fade-in-50 duration-200" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center justify-between cursor-pointer transition-colors duration-200 hover:bg-accent/80"
        >
          <div className="flex items-center gap-3">
            <Monitor className="size-4 text-muted-foreground" />
            <span className="font-medium">{t("system")}</span>
          </div>
          {theme === "system" && (
            <Check className="size-4 text-primary animate-in fade-in-50 duration-200" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
