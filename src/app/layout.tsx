import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getMetadataBase } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
