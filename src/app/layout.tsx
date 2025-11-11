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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
