import type { MetadataRoute } from "next";

const siteUrl = "https://trashure-web-app.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        /*
         * Applies to Googlebot, Bingbot, DuckDuckBot,
         * Yahoo Slurp, and other compliant crawlers.
         */
        userAgent: "*",

        /*
         * Allow search engines to crawl the public website.
         */
        allow: "/",

        /*
         * Prevent crawling of private, account,
         * dashboard, and API routes.
         */
        disallow: [
          "/api/",
          "/admin/",
          "/profiles/",
          "/auth/",
          "/login",
          "/create-account",
          "/forgot-password",
          "/reset-password",
          "/onboarding",
        ],
      },
    ],

    sitemap: `${siteUrl}/sitemap.xml`,
  };
}