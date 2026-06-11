import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ICTA Dashboard",
  description: "ICT Authority executive dashboard for the Digital & AI Skills Training Program."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
