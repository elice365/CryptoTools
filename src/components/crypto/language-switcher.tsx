"use client";

import { locales } from "@/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter } from "@/lib/navigation";
import { useLocale, useTranslations } from "next-intl";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("language");

  return (
    <Select
      value={locale}
      onValueChange={(value) => {
        router.replace(pathname, { locale: value });
      }}
    >
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder={t("label")}>{t(locale)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {t(loc)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
