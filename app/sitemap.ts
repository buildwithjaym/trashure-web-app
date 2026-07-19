import type { MetadataRoute } from "next";

const siteUrl = "https://trashure-web-app.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/`,
    },
    {
      url: `${siteUrl}/how-it-works`,
    },
    {
      url: `${siteUrl}/about-the-developer`,
    },
    {
      url: `${siteUrl}/documentation`,
    },
    {
      url: `${siteUrl}/contact`,
    },
    {
      url: `${siteUrl}/privacy`,
    },
    {
      url: `${siteUrl}/terms`,
    },
  ];
}