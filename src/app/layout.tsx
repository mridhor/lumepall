import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumepall - fond varasema nimega Snobol fond",
  description: "Lumepall fond varasema nimega Snobol fond",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  openGraph: {
    title: "Lumepall - fond varasema nimega Snobol fond",
    description: "Lumepall fond varasema nimega Snobol fond",
    url: "https://lumepall.ee",
    siteName: "Lumepall",
    images: [
      {
        url: "/lumepall-ogi.png",
        width: 1200,
        height: 630,
        alt: "Lumepall - fond varasema nimega Snobol fond",
      },
    ],
    locale: "ee_EE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lumepall - fond varasema nimega Snobol fond",
    description: "Lumepall fond varasema nimega Snobol fond",
    images: ["/lumepall-ogi.png"],
  },
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params?: Promise<Record<string, string | string[]>>;
}>) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/84b9aae2-7bb6-46af-9250-5d3c16bed33e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:49',message:'RootLayout entry',data:{hasParams:!!params,isPromise:params instanceof Promise},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  
  // In Next.js 16, params is always a Promise and must be awaited immediately
  // We await it but don't store it to prevent enumeration during serialization
  if (params) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/84b9aae2-7bb6-46af-9250-5d3c16bed33e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:56',message:'Awaiting params to prevent enumeration',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    await params; // Immediately await to unwrap, but don't store the result
  }
  
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}
      >
        {children}
      </body>
    </html>
  );
}
