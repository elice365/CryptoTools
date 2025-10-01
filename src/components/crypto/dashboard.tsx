"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, type ElementType, type ReactNode } from "react";
import { Sparkles, Shield, Zap, Globe, ChevronRight, Play } from "lucide-react";
import { Base64Tool } from "@/components/crypto/base64-tool";
import { HashTool } from "@/components/crypto/hash-tool";
import { SymmetricTool } from "@/components/crypto/symmetric-tool";
import { AsymmetricTool } from "@/components/crypto/asymmetric-tool";
import { EncodingTools } from "@/components/crypto/encoding-tools";
import { FileStreamingTools } from "@/components/crypto/file-streaming-tools";
import { ThemeToggle } from "@/components/crypto/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TOOL_DEFINITIONS,
  TOOL_IDS,
  type ToolId,
} from "@/lib/tool-config";

const heroAccent = "bg-gradient-to-br from-primary/25 via-primary/5 to-transparent";

type ToolDefinition = {
  id: ToolId;
  icon: ElementType;
  color: string;
  badge: string;
  title: string;
  description: string;
  features: string[];
  component: ReactNode;
};

type CryptoDashboardProps = {
  initialTool?: ToolId | null;
};

export function CryptoDashboard({ initialTool = null }: CryptoDashboardProps) {
  const t = useTranslations();
  const [activeCategory, setActiveCategory] = useState<ToolId | null>(initialTool);

  const tools = useMemo<ToolDefinition[]>(() => {
    const componentMap: Record<ToolId, ReactNode> = {
      base64: <Base64Tool />,
      hash: <HashTool />,
      symmetric: <SymmetricTool />,
      asymmetric: <AsymmetricTool />,
      encoding: <EncodingTools />,
      files: <FileStreamingTools />,
    };

    return TOOL_IDS.map((toolId) => {
      const config = TOOL_DEFINITIONS[toolId];
      const Icon = config.icon;

      return {
        id: toolId,
        icon: Icon,
        color: config.gradient,
        badge: t(config.badgeKey),
        title: t(config.titleKey),
        description: t(config.descriptionKey),
        features: config.features.map((feature) =>
          feature.key ? t(feature.key) : feature.raw ?? "",
        ),
        component: componentMap[toolId],
      } satisfies ToolDefinition;
    });
  }, [t]);

  const activeTool = activeCategory
    ? tools.find((tool) => tool.id === activeCategory) ?? null
    : null;

  const navigationTools = useMemo<ToolDefinition[]>(() => {
    return TOOL_IDS.map((toolId) => {
      const config = TOOL_DEFINITIONS[toolId];
      const Icon = config.icon;

      return {
        id: toolId,
        icon: Icon,
        color: config.gradient,
        badge: t(config.badgeKey),
        title: t(config.titleKey),
        description: t(config.descriptionKey),
        features: config.features.map((feature) =>
          feature.key ? t(feature.key) : feature.raw ?? "",
        ),
      } satisfies ToolDefinition;
    });
  }, [t]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">



      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-10">


        {/* Sidebar Navigation */}
        <aside className="hidden min-w-0 lg:flex lg:w-[320px] lg:flex-col lg:gap-8">
          <Card className={cn("border-border/60 bg-card/80 shadow-lg", heroAccent)}>
            <CardHeader className="space-y-3">
              <Badge className="w-fit bg-primary text-primary-foreground shadow">
                {t("app.features.security.title")}
              </Badge>
              <CardTitle className="text-xl font-semibold text-foreground">
                {t("app.welcome")}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {t("app.welcomeDescription")}
              </CardDescription>
            </CardHeader>
          </Card>

          <nav className="space-y-2.5">
            {navigationTools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeCategory === tool.id;

              return (
                <Button
                  key={tool.id}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => setActiveCategory(isActive ? null : tool.id)}
                  className={cn(
                    "group relative flex w-full min-h-[72px] items-stretch justify-between gap-3 overflow-hidden rounded-2xl border border-transparent px-4 py-3.5 text-left text-sm leading-relaxed transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-card/80 text-muted-foreground hover:border-border/70 hover:bg-primary/10 hover:text-foreground",
                  )}
                >
                  <span className="flex items-start gap-3 text-left">
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow",
                        tool.color,
                        !isActive && "opacity-90",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex flex-1 flex-col gap-1 text-left">
                      <span className="text-sm font-semibold md:text-base leading-tight text-balance">
                        {tool.title}
                      </span>
                      <span className="text-xs text-muted-foreground/90 line-clamp-2 text-pretty">
                        {tool.description}
                      </span>
                    </span>
                  </span>
                  <ChevronRight
                    className={cn(
                      "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:text-foreground",
                      isActive && "translate-x-1 text-primary-foreground",
                    )}
                  />
                </Button>
              );
            })}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-10">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-8 shadow-xl transition-colors">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_45%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_transparent_50%)]" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl space-y-4">
                <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  {t("app.welcome")}
                </h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {t("app.welcomeDescription")}
                </p>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2">
                    <Shield className="h-4 w-4 text-primary" />
                    {t("app.features.security.title")}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2">
                    <Zap className="h-4 w-4 text-primary" />
                    {t("app.features.realtime.title")}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2">
                    <Globe className="h-4 w-4 text-primary" />
                    {t("app.features.multilingual.title")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {activeTool ? (
            <Card className="overflow-hidden border-border/60 bg-card/80 shadow-xl">
              <CardHeader className="border-b border-border/60 bg-background/70 px-8 py-6">
                <div className="flex flex-wrap items-center gap-5">
                  {(() => {
                    const Icon = activeTool.icon;
                    return (
                      <span
                        className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                          activeTool.color,
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </span>
                    );
                  })()}
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-2xl font-semibold text-foreground">
                      {activeTool.title}
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      {activeTool.description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setActiveCategory(null)}
                    className="rounded-2xl border-border bg-background/80 text-muted-foreground transition hover:text-foreground"
                  >
                    ← {t("common.back")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="bg-background/60 p-8">
                {activeTool.component}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Tool Grid */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {navigationTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Card
                      key={tool.id}
                      className="group h-full cursor-pointer overflow-hidden border-border/60 bg-card/80 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
                      onClick={() => setActiveCategory(tool.id)}
                    >
                      <div className={cn("relative h-32 bg-gradient-to-br", tool.color)}>
                        <div className="absolute inset-0 bg-black/15 dark:bg-black/30" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/25" />
                        <div className="relative flex h-full items-center justify-center">
                          <Icon className="h-12 w-12 text-white drop-shadow-lg" />
                        </div>
                        <Badge className="absolute top-4 right-4 bg-white/30 text-white shadow-lg backdrop-blur">
                          {tool.badge}
                        </Badge>
                      </div>
                      <CardHeader className="space-y-3">
                        <CardTitle className="text-xl font-semibold text-foreground">
                          {tool.title}
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                          {tool.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          {tool.features.map((feature) => (
                            <span
                              key={feature}
                              className="flex items-center gap-3 text-sm text-muted-foreground"
                            >
                              <span className="h-2 w-2 rounded-full bg-primary/60" />
                              <span className="font-medium text-foreground/90">
                                {feature}
                              </span>
                            </span>
                          ))}
                        </div>
                        <Button className="w-full rounded-2xl bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90">
                          <Play className="mr-2 h-4 w-4" />
                          {t("common.start")}
                          <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card className="border-border/60 bg-card/80 p-6 text-center shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
                  <Shield className="mx-auto h-12 w-12 text-primary" />
                  <h3 className="mt-4 text-xl font-semibold text-foreground">
                    {t("app.features.security.title")}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t("app.features.security.description")}
                  </p>
                </Card>
                <Card className="border-border/60 bg-card/80 p-6 text-center shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
                  <Zap className="mx-auto h-12 w-12 text-primary" />
                  <h3 className="mt-4 text-xl font-semibold text-foreground">
                    {t("app.features.realtime.title")}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t("app.features.realtime.description")}
                  </p>
                </Card>
                <Card className="border-border/60 bg-card/80 p-6 text-center shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
                  <Globe className="mx-auto h-12 w-12 text-primary" />
                  <h3 className="mt-4 text-xl font-semibold text-foreground">
                    {t("app.features.multilingual.title")}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t("app.features.multilingual.description")}
                  </p>
                </Card>
              </div>
            </>
          )}
        </section>
      </main>
      <footer className="border-t border-border/60 bg-background/80 py-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-6 text-center">
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            {t("app.footer")}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("app.footerDescription")}
          </p>
        </div>
      </footer>
    </div>
  );
}
