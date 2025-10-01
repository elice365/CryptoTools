"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useMemo, type ComponentType } from "react";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/crypto/theme-toggle";
import { Base64Tool } from "@/components/crypto/base64-tool";
import { HashTool } from "@/components/crypto/hash-tool";
import { SymmetricTool } from "@/components/crypto/symmetric-tool";
import { AsymmetricTool } from "@/components/crypto/asymmetric-tool";
import { EncodingTools } from "@/components/crypto/encoding-tools";
import { FileStreamingTools } from "@/components/crypto/file-streaming-tools";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TOOL_DEFINITIONS,
  type ToolAlias,
  type ToolId,
} from "@/lib/tool-config";

type ToolDetailProps = {
  toolId: ToolId;
  locale: string;
  alias?: ToolAlias;
};

const TOOL_COMPONENTS: Record<ToolId, ComponentType<any>> = {
  base64: Base64Tool,
  hash: HashTool,
  symmetric: SymmetricTool,
  asymmetric: AsymmetricTool,
  encoding: EncodingTools,
  files: FileStreamingTools,
};

export function ToolDetail({ toolId, locale, alias }: ToolDetailProps) {
  const t = useTranslations();
  const config = TOOL_DEFINITIONS[toolId];
  const ToolIcon = config.icon;

  const toolMeta = useMemo(() => {
    const titleKey = alias?.titleKey ?? config.titleKey;
    const descriptionKey = alias?.descriptionKey ?? config.descriptionKey;
    const badgeKey = alias?.badgeKey ?? config.badgeKey;

    const title = t(titleKey);
    const description = t(descriptionKey);
    const badge = t(badgeKey);
    const features = config.features
      .map((feature) => (feature.key ? t(feature.key) : feature.raw ?? ""))
      .filter(Boolean);

    return { title, description, badge, features };
  }, [alias, config, t]);

  const ToolComponent = TOOL_COMPONENTS[toolId];
  const toolProps = alias?.initialProps ?? {};

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-border hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("common.back")}
            </Link>
            <span className="hidden text-sm text-muted-foreground md:inline">
              {t("app.title")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-10">
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-8 shadow-xl">
          <div
            className={cn(
              "absolute inset-0 opacity-90",
              "bg-gradient-to-br",
              config.gradient,
            )}
          ></div>
          <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-4 text-white">
              <Badge className="bg-white/20 text-white shadow-lg backdrop-blur">
                {toolMeta.badge}
              </Badge>
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/20">
                  <ToolIcon className="h-7 w-7" />
                </span>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  {toolMeta.title}
                </h1>
              </div>
              <p className="text-base leading-relaxed text-white/90 md:text-lg">
                {toolMeta.description}
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                {toolMeta.features.map((feature) => (
                  <span
                    key={feature}
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/20 px-4 py-2 text-white/90"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-border/70 bg-card/80 p-4 shadow-lg">
            <span
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                config.gradient,
              )}
            >
              <ToolIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                {toolMeta.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {toolMeta.description}
              </p>
            </div>
          </div>

          <ToolComponent {...toolProps} />
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="border-border/70 bg-card/80 p-6 shadow-lg">
            <CardTitle className="text-lg font-semibold">
              {t("app.features.security.title")}
            </CardTitle>
            <CardDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("app.features.security.description")}
            </CardDescription>
          </Card>
          <Card className="border-border/70 bg-card/80 p-6 shadow-lg">
            <CardTitle className="text-lg font-semibold">
              {t("app.features.realtime.title")}
            </CardTitle>
            <CardDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("app.features.realtime.description")}
            </CardDescription>
          </Card>
          <Card className="border-border/70 bg-card/80 p-6 shadow-lg md:col-span-2">
            <CardTitle className="text-lg font-semibold">
              {t("app.features.multilingual.title")}
            </CardTitle>
            <CardDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("app.features.multilingual.description")}
            </CardDescription>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {toolMeta.features.map((feature) => (
                <Badge key={feature} variant="outline" className="bg-background/60">
                  {feature}
                </Badge>
              ))}
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border/70 bg-background/80 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-6 text-center">
          <div className="text-sm font-medium text-muted-foreground">
            {t("app.footer")}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("app.footerDescription")}
          </p>
          <Button
            variant="ghost"
            asChild
            className="mt-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <Link href={`/${locale}`}>{t("navigation.home")}</Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}
