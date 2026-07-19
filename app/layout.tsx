import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
});

const siteUrl = "https://trashure-web-app.vercel.app";

const siteName = "Trashure";

const defaultTitle =
  "Trashure | AI Circular Recovery & Waste Intelligence";

const fullProductName =
  "Trashure: An AI-Powered Circular Recovery and Waste Intelligence Platform";

const description =
  "Trashure turns trash into treasure using AI material scanning, circular recovery recommendations, and waste intelligence for communities in the Philippines.";

const developerName = "Jaymar Maruji";

const developerPortfolio = "https://www.jaymmaruji.online";

const socialImage = `${siteUrl}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  applicationName: siteName,

  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },

  description,

  keywords: [
    "Trashure",
    "Trashure Philippines",
    "turn trash into treasure",
    "AI waste identification",
    "AI material scanner",
    "AI recycling platform",
    "circular recovery platform",
    "waste intelligence platform",
    "recycling application Philippines",
    "waste recovery Philippines",
    "circular economy Philippines",
    "recyclable material scanner",
    "recyclable material recovery",
    "reuse sell donate recycle",
    "junkshop material matching",
    "community waste management",
    "school recycling platform",
    "barangay waste monitoring",
    "LGU waste intelligence",
    "waste recovery analytics",
    "sustainable waste management",
  ],

  authors: [
    {
      name: developerName,
      url: developerPortfolio,
    },
  ],

  creator: developerName,
  publisher: siteName,

  category: "Technology",

  classification:
    "Artificial intelligence, circular recovery, recycling, sustainability, and community waste intelligence platform",

  referrer: "origin-when-cross-origin",

  alternates: {
    canonical: siteUrl,
    languages: {
      "en-PH": siteUrl,
    },
  },

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  openGraph: {
    type: "website",
    url: siteUrl,
    locale: "en_PH",
    siteName,
    title: fullProductName,
    description,
    images: [
      {
        url: socialImage,
        secureUrl: socialImage,
        width: 1200,
        height: 630,
        alt: "Trashure AI-powered circular recovery and waste intelligence platform",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description,
    images: [
      {
        url: socialImage,
        alt: "Trashure turns trash into treasure using AI",
      },
    ],
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,

    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  icons: {
    icon: [
      {
        url: "/logo.png",
        type: "image/png",
      },
    ],

    shortcut: "/logo.png",

    apple: [
      {
        url: "/logo.png",
        type: "image/png",
      },
    ],
  },

  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: "default",
  },

  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      }
    : undefined,

  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#15803d",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",

  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#ffffff",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#07100b",
    },
  ],

  colorScheme: "light dark",
};

const structuredData = {
  "@context": "https://schema.org",

  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,

      url: `${siteUrl}/`,
      name: siteName,

      alternateName: [
        "Trashure AI",
        "Trashure Waste Intelligence",
        "Trashure Circular Recovery Platform",
        fullProductName,
      ],

      description,
      inLanguage: "en-PH",

      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
    },

    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,

      name: siteName,
      url: `${siteUrl}/`,
      slogan: "Turn Trash into Treasure",

      description:
        "Trashure develops AI-powered tools for material identification, circular recovery, recycling, and community waste intelligence.",

      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
        contentUrl: `${siteUrl}/logo.png`,
      },

      image: {
        "@type": "ImageObject",
        url: socialImage,
      },

      founder: {
        "@id": `${siteUrl}/#developer`,
      },
    },

    {
      "@type": "Person",
      "@id": `${siteUrl}/#developer`,

      name: developerName,
      url: developerPortfolio,

      image: {
        "@type": "ImageObject",
        url: `${siteUrl}/jaymar.jpg`,
      },

      jobTitle: "Software Engineer and Product Developer",

      description:
        "Solo developer and product builder behind Trashure, an AI-powered circular recovery and waste intelligence platform.",

      sameAs: [developerPortfolio],

      knowsAbout: [
        "Software Engineering",
        "Full-Stack Web Development",
        "Next.js",
        "React",
        "TypeScript",
        "Artificial Intelligence",
        "Computer Vision",
        "Supabase",
        "PostgreSQL",
        "Circular Economy",
        "Waste Intelligence",
      ],

      worksFor: {
        "@id": `${siteUrl}/#organization`,
      },
    },

    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#application`,

      name: siteName,
      alternateName: fullProductName,

      url: `${siteUrl}/`,
      image: socialImage,
      screenshot: socialImage,

      description,

      applicationCategory: "UtilitiesApplication",

      applicationSubCategory:
        "Circular recovery and waste intelligence platform",

      operatingSystem:
        "Any operating system with a modern web browser",

      browserRequirements:
        "Requires JavaScript and a modern web browser",

      inLanguage: "en-PH",

      creator: {
        "@id": `${siteUrl}/#developer`,
      },

      provider: {
        "@id": `${siteUrl}/#organization`,
      },

      areaServed: {
        "@type": "Country",
        name: "Philippines",
      },

      audience: [
        {
          "@type": "Audience",
          audienceType: "Residents and households",
        },
        {
          "@type": "Audience",
          audienceType: "Recyclers and junkshops",
        },
        {
          "@type": "Audience",
          audienceType: "Schools and educational institutions",
        },
        {
          "@type": "Audience",
          audienceType: "Community organizations",
        },
        {
          "@type": "Audience",
          audienceType: "Barangays and local government units",
        },
      ],

      featureList: [
        "AI-powered material and object identification",
        "Material type and recovery potential analysis",
        "Reuse, repair, sell, donate, recover, and recycle recommendations",
        "Resident material confirmation and correction",
        "Recycler and junkshop material matching",
        "School and community recycling drives",
        "Material recovery offers and transactions",
        "Completed recovery monitoring",
        "Barangay-level material insights",
        "LGU waste recovery analytics",
        "Community circular economy intelligence",
      ],

      keywords: [
        "artificial intelligence",
        "waste recovery",
        "material scanner",
        "recycling",
        "circular economy",
        "waste intelligence",
        "sustainability",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-PH" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${inter.className} min-h-screen antialiased`}
      >
        <script
          id="trashure-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(
              /</g,
              "\\u003c",
            ),
          }}
        />

        {children}

        <Toaster
          position="top-right"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}