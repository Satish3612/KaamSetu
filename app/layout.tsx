import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KaamSetu | Har Kaam Ka Verified Expert",
  description: "Apne area ke verified service professionals se aasani se connect karein.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
