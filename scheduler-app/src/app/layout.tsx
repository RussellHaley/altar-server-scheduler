import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SJHN Altar Server Scheduler",
  description: "Altar server rota management",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
