import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vektor — Security Operations & Response",
  description: "Enterprise CrowdStrike Telemetry, Investigation & Response Workspace",
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

