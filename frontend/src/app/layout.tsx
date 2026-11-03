import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AISOC — AI Security Operations Center & SOAR",
  description: "Autonomous CrowdStrike Falcon Triage & Response with Claude AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-canvas text-gray-100 antialiased selection:bg-red-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

