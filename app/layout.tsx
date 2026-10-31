import './globals.css';
import type { ReactNode } from 'react';
export const metadata={title:'AURA Nutrition & Coaching AI',description:'Private athlete nutrition intelligence'};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en"><body><div className="mx-auto max-w-6xl px-5 py-7"><header className="mb-8 flex justify-between"><a href="/" className="text-2xl font-black text-purple-400">AURA</a><nav className="flex gap-5"><a href="/dashboard">Dashboard</a><a href="/coach">Coach</a><a href="/settings">Settings</a></nav></header>{children}</div></body></html>}
