import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Decentralized Crowdfunding & Milestone Escrow",
  description:
    "Raise funds on-chain with milestone-gated escrow: contributors vote to release funds, and reclaim refunds if a campaign fails.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
