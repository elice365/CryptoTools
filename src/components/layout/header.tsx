import { ThemeToggle } from "@/components/crypto/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function Header() {
  const t = useTranslations("app");

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between py-4">
        <Link href="/" className="text-lg font-bold">
          {t("title")}
        </Link>
        <div className="flex items-center space-x-4">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
