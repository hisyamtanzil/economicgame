import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const image = host ? `${protocol}://${host}/og.png` : undefined;
  const title = "Commonwealth Policy Lab";
  const description = "A policy simulation about growth, equality, and human development.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website", images: image ? [{ url: image, width: 1680, height: 945, alt: "Commonwealth Policy Lab" }] : [] },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : [] },
  };
}

export const viewport: Viewport = { themeColor: "#101b24" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <html lang="en"><body>{children}</body></html>;
}
