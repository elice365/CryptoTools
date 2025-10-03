import type { ElementType } from "react";
import {
  Code,
  FileText,
  HardDrive,
  Hash,
  Lock,
  ShieldCheck,
  Layers,
  KeyRound,
  Shield,
  Zap,
  Sparkles,
  Key,
  Binary,
  Shuffle,
  Fingerprint,
  Boxes,
  ShieldAlert,
} from "lucide-react";

export const TOOL_IDS = [
  "base64",
  "hash",
  "symmetric",
  "asymmetric",
  "encoding",
  "files",
  "bgv",
  "elgamal",
  "paillier",
  "pqc",
  "stream",
  "des",
  "tripledes",
  "rc4",
  "rabbit",
  "sha3",
  "blake2",
  "ecies",
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export type ToolFeature = {
  key?: string;
  raw?: string;
};

export type ToolAlias = {
  slug: string;
  path: string; // Added path property
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
        path: "sha256", // Added path
        titleKey: "hash.algorithms.sha256",
        badgeKey: "hash.algorithms.sha256",
        initialProps: { initialAlgorithm: "sha256" },
      },
      {
        slug: "sha512",
        path: "sha512", // Added path
        titleKey: "hash.algorithms.sha512",
        badgeKey: "hash.algorithms.sha512",
        initialProps: { initialAlgorithm: "sha512" },
      },
      {
        slug: "sha384",
        path: "sha384", // Added path
        titleKey: "hash.algorithms.sha384",
        badgeKey: "hash.algorithms.sha384",
        initialProps: { initialAlgorithm: "sha384" },
      },
      {
        slug: "sha1",
        path: "sha1", // Added path
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
        path: "aes", // Added path
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
    aliases: [
      {
        slug: "rsa",
        path: "rsa",
        titleKey: "asymmetric.algorithms.rsa",
        badgeKey: "asymmetric.algorithms.rsa",
        descriptionKey: "asymmetric.rsa.description",
        initialProps: { initialAlgorithm: "rsa" },
      },
      {
        slug: "ecc",
        path: "ecc",
        titleKey: "asymmetric.algorithms.ecc",
        badgeKey: "asymmetric.algorithms.ecc",
        descriptionKey: "asymmetric.ecc.description",
        initialProps: { initialAlgorithm: "ecc" },
      },
    ],
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
  bgv: {
    icon: Layers,
    gradient: "from-indigo-500/80 via-purple-600/70 to-violet-500/70",
    badgeKey: "bgv.title",
    titleKey: "bgv.title",
    descriptionKey: "bgv.description",
    features: [
      { key: "bgv.features.homomorphic" },
      { key: "common.encrypt" },
      { key: "bgv.features.compute" },
    ],
    path: "bgv",
  },
  elgamal: {
    icon: KeyRound,
    gradient: "from-yellow-500/80 via-orange-500/70 to-red-500/70",
    badgeKey: "elgamal.title",
    titleKey: "elgamal.title",
    descriptionKey: "elgamal.description",
    features: [
      { key: "common.generate" },
      { key: "common.encrypt" },
      { key: "elgamal.features.asymmetric" },
    ],
    path: "elgamal",
  },
  paillier: {
    icon: Shield,
    gradient: "from-green-500/80 via-emerald-500/70 to-teal-600/70",
    badgeKey: "paillier.title",
    titleKey: "paillier.title",
    descriptionKey: "paillier.description",
    features: [
      { key: "paillier.features.probabilistic" },
      { key: "common.encrypt" },
      { key: "paillier.features.additive" },
    ],
    path: "paillier",
  },
  pqc: {
    icon: Sparkles,
    gradient: "from-pink-500/80 via-rose-500/70 to-red-600/70",
    badgeKey: "pqc.title",
    titleKey: "pqc.title",
    descriptionKey: "pqc.description",
    features: [
      { key: "pqc.features.kyber" },
      { key: "pqc.features.dilithium" },
      { key: "pqc.features.quantum" },
    ],
    path: "pqc",
  },
  stream: {
    icon: Zap,
    gradient: "from-blue-500/80 via-cyan-500/70 to-teal-500/70",
    badgeKey: "stream.title",
    titleKey: "stream.title",
    descriptionKey: "stream.description",
    features: [
      { key: "stream.features.chacha20" },
      { key: "stream.features.salsa20" },
      { key: "stream.features.fast" },
    ],
    path: "stream",
  },
  des: {
    icon: Key,
    gradient: "from-slate-500/80 via-gray-600/70 to-zinc-500/70",
    badgeKey: "des.title",
    titleKey: "des.title",
    descriptionKey: "des.description",
    features: [
      { raw: "56-bit" },
      { key: "common.encrypt" },
      { key: "des.features.legacy" },
    ],
    path: "des",
  },
  tripledes: {
    icon: Boxes,
    gradient: "from-violet-500/80 via-purple-500/70 to-indigo-600/70",
    badgeKey: "tripledes.title",
    titleKey: "tripledes.title",
    descriptionKey: "tripledes.description",
    features: [
      { raw: "168-bit" },
      { key: "common.encrypt" },
      { key: "tripledes.features.triple" },
    ],
    path: "tripledes",
  },
  rc4: {
    icon: Shuffle,
    gradient: "from-amber-500/80 via-yellow-500/70 to-orange-500/70",
    badgeKey: "rc4.title",
    titleKey: "rc4.title",
    descriptionKey: "rc4.description",
    features: [
      { key: "rc4.features.stream" },
      { key: "common.encrypt" },
      { key: "rc4.features.fast" },
    ],
    path: "rc4",
  },
  rabbit: {
    icon: Zap,
    gradient: "from-lime-500/80 via-green-500/70 to-emerald-500/70",
    badgeKey: "rabbit.title",
    titleKey: "rabbit.title",
    descriptionKey: "rabbit.description",
    features: [
      { key: "rabbit.features.stream" },
      { key: "common.encrypt" },
      { key: "rabbit.features.fast" },
    ],
    path: "rabbit",
  },
  sha3: {
    icon: Fingerprint,
    gradient: "from-sky-500/80 via-blue-500/70 to-indigo-500/70",
    badgeKey: "sha3.title",
    titleKey: "sha3.title",
    descriptionKey: "sha3.description",
    features: [
      { raw: "SHA3-256" },
      { raw: "SHA3-512" },
      { key: "common.verify" },
    ],
    path: "sha3",
  },
  blake2: {
    icon: Binary,
    gradient: "from-teal-500/80 via-cyan-500/70 to-blue-600/70",
    badgeKey: "blake2.title",
    titleKey: "blake2.title",
    descriptionKey: "blake2.description",
    features: [
      { raw: "BLAKE2b" },
      { raw: "BLAKE2s" },
      { key: "blake2.features.fast" },
    ],
    path: "blake2",
  },
  ecies: {
    icon: ShieldAlert,
    gradient: "from-red-500/80 via-orange-500/70 to-amber-500/70",
    badgeKey: "ecies.title",
    titleKey: "ecies.title",
    descriptionKey: "ecies.description",
    features: [
      { key: "ecies.features.ecc" },
      { key: "common.encrypt" },
      { key: "ecies.features.integrated" },
    ],
    path: "ecies",
  },
};

export const TOOL_ROUTE_LOOKUP: Record<string, ToolId> = Object.fromEntries(
  TOOL_IDS.flatMap((tool) => {
    const config = TOOL_DEFINITIONS[tool];
    const entries: [string, ToolId][] = [[config.path, tool]];
    if (config.aliases) {
      for (const alias of config.aliases) {
        entries.push([alias.path, tool]); // Now uses alias.path
      }
    }
    return entries;
  }),
);

export const TOOL_ALIAS_LOOKUP: Record<string, { toolId: ToolId; alias: ToolAlias }> = Object.fromEntries(
  TOOL_IDS.flatMap((tool) => {
    const config = TOOL_DEFINITIONS[tool];
    return (config.aliases ?? []).map((alias) => [alias.path, { toolId: tool, alias }]); // Now uses alias.path
  }),
);
