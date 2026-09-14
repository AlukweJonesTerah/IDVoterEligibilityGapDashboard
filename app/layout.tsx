import type { Metadata } from "next";
import "./globals.css";
import { FilterProvider } from "@/components/dashboard/FilterContext";

export const metadata: Metadata = {
  title: "ID & Voter Eligibility Gap Dashboard",
  description: "Kenya 2009 & 2019 census: projected adult population vs. national ID and voter registration."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        <FilterProvider>{children}</FilterProvider>
      </body>
    </html>
  );
}
