import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoPage | Multi-Tenant Facebook Automation Suite",
  description:
    "Production-grade Meta Graph API automation platform for Facebook Pages with automated comment replies, private inbox messaging, and scheduled publishing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-blue-600/30 selection:text-blue-200">
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
          {/* Subtle background ambient gradients */}
          <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[130px]" />
          <div className="absolute top-[40%] -right-[10%] w-[45vw] h-[45vw] rounded-full bg-indigo-600/10 blur-[140px]" />
          <div className="absolute -bottom-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-cyan-600/5 blur-[120px]" />
        </div>
        {children}
      </body>
    </html>
  );
}
