import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { PostHogProvider } from "@/components/PostHogProvider";

export const metadata: Metadata = {
  metadataBase: new URL('https://canadaretirecalc.com'),
  title: {
    default: "Canada Retire Calc - The Ultimate Canadian Retirement Calculator",
    template: "%s | Canada Retire Calc"
  },
  description: "100% Canadian. Tax-accurate retirement income calculator with CPP/OAS optimization, RRSP/TFSA modeling, and provincial tax calculations. Plan your retirement with confidence.",
  keywords: [
    "Canadian retirement calculator",
    "retirement planning Canada",
    "CPP calculator",
    "OAS calculator",
    "RRSP calculator",
    "TFSA calculator",
    "retirement income calculator",
    "Canadian tax calculator",
    "retirement planning tool",
    "pension calculator Canada"
  ],
  authors: [{ name: "Canada Retire Calc" }],
  creator: "Canada Retire Calc",
  publisher: "Canada Retire Calc",
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: 'https://canadaretirecalc.com',
    siteName: 'Canada Retire Calc',
    title: 'Canada Retire Calc - The Ultimate Canadian Retirement Calculator',
    description: '100% Canadian. Tax-accurate retirement income calculator with CPP/OAS optimization, RRSP/TFSA modeling, and provincial tax calculations.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Canada Retire Calc - Canadian Retirement Calculator',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Canada Retire Calc - The Ultimate Canadian Retirement Calculator',
    description: '100% Canadian. Tax-accurate retirement income calculator with CPP/OAS optimization, RRSP/TFSA modeling.',
    images: ['/twitter-image.png'],
    creator: '@canadaretirecalc',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
