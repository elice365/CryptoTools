import type { ElementType } from "react";
import {
  Code,
  FileText,
  HardDrive,
  Hash,
  Lock,
  ShieldCheck,
} from "lucide-react";

export const TOOL_IDS = [
  "base64",
  "hash",
  "symmetric",
  "asymmetric",
  "encoding",
  "files",
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export type ToolFeature = {
  key?: string;
  raw?: string;
};

export type ToolAlias = {
  slug: string;
  titleKey?: string;
  descriptionKey?: string;
  badgeKey?: string;
  initialProps?: Record<string, unknown>;
};

export type ToolTokens = {
  icon: ElementType;
  gradient: string;
  badgeKey: string;
  titleKey: string;
  descriptionKey: string;
  features: ToolFeature[];
  path: string;
  aliases?: ToolAlias[];
};

export const TOOL_DEFINITIONS: Record<ToolId, ToolTokens> = {
  base64: {
    icon: Code,
    gradient: "from-blue-500/80 via-blue-600/70 to-indigo-500/70",
    badgeKey: "navigation.base64",
    titleKey: "base64.title",
    descriptionKey: "base64.description",
    features: [
      { key: "common.generate" },
      { key: "common.upload" },
      { key: "common.verify" },
    ],
    path: "base64",
  },
  hash: {
    icon: Hash,
    gradient: "from-emerald-500/80 via-emerald-600/70 to-teal-500/70",
    badgeKey: "navigation.hash",
    titleKey: "hash.title",
    descriptionKey: "hash.description",
    features: [
      { key: "hash.algorithms.sha256" },
      { key: "common.upload" },
      { key: "common.verify" },
    ],
    path: "hash",
    aliases: [
      {
        slug: "sha256",
        titleKey: "hash.algorithms.sha256",
        badgeKey: "hash.algorithms.sha256",
        initialProps: { initialAlgorithm: "sha256" },
      },
      {
        slug: "sha512",
        titleKey: "hash.algorithms.sha512",
        badgeKey: "hash.algorithms.sha512",
        initialProps: { initialAlgorithm: "sha512" },
      },
      {
        slug: "sha384",
        titleKey: "hash.algorithms.sha384",
        badgeKey: "hash.algorithms.sha384",
        initialProps: { initialAlgorithm: "sha384" },
      },
      {
        slug: "sha1",
        titleKey: "hash.algorithms.sha1",
        badgeKey: "hash.algorithms.sha1",
        initialProps: { initialAlgorithm: "sha1" },
      },
    ],
  },
  symmetric: {
    icon: Lock,
    gradient: "from-purple-500/80 via-violet-600/70 to-fuchsia-500/70",
    badgeKey: "navigation.symmetric",
    titleKey: "symmetric.title",
    descriptionKey: "symmetric.description",
    features: [
      { raw: "AES-256" },
      { key: "common.encrypt" },
      { key: "common.key" },
    ],
    path: "symmetric",
    aliases: [
      {
        slug: "aes",
        titleKey: "symmetric.algorithms.aes",
        badgeKey: "symmetric.algorithms.aes",
        initialProps: { initialAlgorithm: "aes" },
      },
    ],
  },
  asymmetric: {
    icon: ShieldCheck,
    gradient: "from-orange-500/80 via-amber-500/70 to-orange-600/70",
    badgeKey: "navigation.asymmetric",
    titleKey: "asymmetric.title",
    descriptionKey: "asymmetric.description",
    features: [
      { key: "common.generate" },
      { key: "common.verify" },
      { key: "common.encrypt" },
    ],
    path: "asymmetric",
  },
  encoding: {
    icon: FileText,
    gradient: "from-cyan-500/80 via-sky-500/70 to-blue-500/70",
    badgeKey: "encoding.title",
    titleKey: "encoding.title",
    descriptionKey: "encoding.description",
    features: [
      { raw: "URL" },
      { raw: "Hex" },
      { raw: "Binary" },
    ],
    path: "encoding",
  },
  files: {
    icon: HardDrive,
    gradient: "from-rose-500/80 via-pink-500/70 to-red-500/70",
    badgeKey: "files.title",
    titleKey: "files.title",
    descriptionKey: "files.description",
    features: [
      { raw: "Streaming" },
      { raw: "Progress" },
      { raw: "Large Files" },
    ],
    path: "files",
  },
};

export const TOOL_ROUTE_LOOKUP: Record<string, ToolId> = Object.fromEntries(
  TOOL_IDS.flatMap((tool) => {
    const config = TOOL_DEFINITIONS[tool];
    const entries: [string, ToolId][] = [[config.path, tool]];
    if (config.aliases) {
      for (const alias of config.aliases) {
        entries.push([alias.slug, tool]);
      }
    }
    return entries;
  }),
);

export const TOOL_ALIAS_LOOKUP: Record<string, { toolId: ToolId; alias: ToolAlias }> = Object.fromEntries(
  TOOL_IDS.flatMap((tool) => {
    const config = TOOL_DEFINITIONS[tool];
    return (config.aliases ?? []).map((alias) => [alias.slug, { toolId: tool, alias }]);
  }),
);
