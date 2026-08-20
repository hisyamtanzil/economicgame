import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const image = host ? `${protocol}://${host}/og.png` : undefined;
  const title = "Nations in Balance";
  const description = "Lead a fictional nation through forty quarters of economic trade-offs, public capacity, and national stability.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website", images: image ? [{ url: image, width: 1680, height: 945, alt: "Nations in Balance" }] : [] },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : [] },
  };
}

export const viewport: Viewport = { themeColor: "#091721" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <html lang="en"><body>{children}</body></html>;
}
