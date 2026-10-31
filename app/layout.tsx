import "./globals.css";
import type { ReactNode } from "react";
import Navigation from "@/components/Navigation";
export const metadata = {
  title: { default: "AURA — Nutrition intelligence", template: "%s · AURA" },
  description:
    "Your personal nutrition workspace. Track meals, understand your trends, and get contextual AI coaching.",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <div className="workspace">
          {children}
          <footer className="app-footer">
            <span>AURA / NUTRITION INTELLIGENCE</span>
            <span>Your progress. Your pace.</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
