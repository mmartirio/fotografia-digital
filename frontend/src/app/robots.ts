import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/backend";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/cliente", "/painel"] },
    sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
  };
}
