import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fair Financial Academy",
  description: "Learning Today. Leading Tomorrow."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
