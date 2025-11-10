"use client";

import dynamic from "next/dynamic";
import type { ComponentType, ReactElement } from "react";

import type { ToolId } from "@/lib/tool-config";

export type ToolEntryComponent<Props = Record<string, unknown>> = ComponentType<Props> & {
  preload?: () => void;
};

type LoaderModule<T extends ComponentType<any>> = { default: T };

type ToolLoader<T extends ComponentType<any>> = () => Promise<LoaderModule<T>>;

const ToolLoading = (): ReactElement => (
  <div className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">
    Loading tool...
  </div>
);

const createToolLoader = <T extends ComponentType<any>>(loader: ToolLoader<T>) =>
  dynamic(loader, {
    loading: ToolLoading,
    ssr: false,
  }) as ToolEntryComponent<T extends ComponentType<infer P> ? P : never>;

export const TOOL_COMPONENTS: Record<ToolId, ToolEntryComponent> = {
  base64: createToolLoader(() =>
    import("./base64-tool").then((mod) => ({ default: mod.Base64Tool })),
  ),
  hash: createToolLoader(() =>
    import("./hash-tool").then((mod) => ({ default: mod.HashTool })),
  ),
  symmetric: createToolLoader(() =>
    import("./symmetric-tool").then((mod) => ({ default: mod.SymmetricTool })),
  ),
  asymmetric: createToolLoader(() =>
    import("./asymmetric-tool").then((mod) => ({ default: mod.AsymmetricTool })),
  ),
  encoding: createToolLoader(() =>
    import("./encoding-tools").then((mod) => ({ default: mod.EncodingTools })),
  ),
  files: createToolLoader(() =>
    import("./file-streaming-tools").then((mod) => ({ default: mod.FileStreamingTools })),
  ),
  bgv: createToolLoader(() =>
    import("./bgv-tool").then((mod) => ({ default: mod.BgvTool })),
  ),
  elgamal: createToolLoader(() =>
    import("./elgamal-tool").then((mod) => ({ default: mod.ElgamalTool })),
  ),
  paillier: createToolLoader(() =>
    import("./paillier-tool").then((mod) => ({ default: mod.PaillierTool })),
  ),
  pqc: createToolLoader(() =>
    import("./pqc-tool").then((mod) => ({ default: mod.PqcTool })),
  ),
  stream: createToolLoader(() =>
    import("./stream-tool").then((mod) => ({ default: mod.StreamTool })),
  ),
  des: createToolLoader(() =>
    import("./des-tool").then((mod) => ({ default: mod.DesTool })),
  ),
  tripledes: createToolLoader(() =>
    import("./tripledes-tool").then((mod) => ({ default: mod.TripleDesTool })),
  ),
  rc4: createToolLoader(() =>
    import("./rc4-tool").then((mod) => ({ default: mod.Rc4Tool })),
  ),
  rabbit: createToolLoader(() =>
    import("./rabbit-tool").then((mod) => ({ default: mod.RabbitTool })),
  ),
  sha3: createToolLoader(() =>
    import("./sha3-tool").then((mod) => ({ default: mod.Sha3Tool })),
  ),
  blake2: createToolLoader(() =>
    import("./blake2-tool").then((mod) => ({ default: mod.Blake2Tool })),
  ),
  ecies: createToolLoader(() =>
    import("./ecies-tool").then((mod) => ({ default: mod.EciesTool })),
  ),
};

export const preloadToolComponent = (toolId: ToolId) => {
  TOOL_COMPONENTS[toolId]?.preload?.();
};
