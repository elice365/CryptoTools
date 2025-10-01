"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, Globe, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/lib/navigation";
import { useEffect, useState, useTransition } from "react";

const locales = [
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "id", name: "Bahasa Indonesia", flag: "🇮🇩" },
];

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="언어 선택" disabled>
        <Globe className="size-4 animate-pulse" />
      </Button>
    );
  }

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) return;

    startTransition(() => {
      router.push(pathname, { locale: newLocale });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="언어 선택"
          className="relative transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
          disabled={isPending}
        >
          {isPending ? (
            <Globe className="size-4 animate-spin" />
          ) : (
            <Languages className="size-4 transition-transform duration-200 hover:scale-110" />
          )}
          <span className="sr-only">언어 선택</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[220px] shadow-lg border-border/50 backdrop-blur-sm"
        sideOffset={5}
      >
        {locales.map((localeOption) => (
          <DropdownMenuItem
            key={localeOption.code}
            onClick={() => switchLocale(localeOption.code)}
            className="flex items-center justify-between cursor-pointer transition-colors duration-200 hover:bg-accent/80"
            disabled={isPending}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg select-none">{localeOption.flag}</span>
              <span className="font-medium truncate max-w-[150px]">{localeOption.name}</span>
            </div>
            {locale === localeOption.code && (
              <Check className="size-4 text-primary animate-in fade-in-50 duration-200" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}