const fs = require("fs");
const path = require("path");

module.exports = function(eleventyConfig) {
  // Pass through files that shouldn't be processed by Eleventy
  eleventyConfig.addPassthroughCopy("src/assets");

  // Copy everything in src/pictures except unused reference/archive material
  // that shouldn't ship to production (adds ~220MB of dead weight otherwise).
  const EXCLUDED_PICTURES = new Set(["archive", "faviconlogo.png", "media_manifest.txt"]);
  const picturesDir = path.join(__dirname, "src/pictures");
  for (const entry of fs.readdirSync(picturesDir)) {
    if (EXCLUDED_PICTURES.has(entry)) continue;
    eleventyConfig.addPassthroughCopy({ [`src/pictures/${entry}`]: `pictures/${entry}` });
  }

  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/sitemap.xml");
  eleventyConfig.addPassthroughCopy("src/CNAME");

  // Self-hosted GSAP + Lenis for scroll-driven animation and smooth scroll
  eleventyConfig.addPassthroughCopy({
    "node_modules/gsap/dist/gsap.min.js": "assets/vendor/gsap.min.js",
    "node_modules/gsap/dist/ScrollTrigger.min.js": "assets/vendor/ScrollTrigger.min.js",
    "node_modules/lenis/dist/lenis.min.js": "assets/vendor/lenis.min.js"
  });

  // $4 / $6.50 style price formatting for the menu
  eleventyConfig.addFilter("money", (price) => {
    if (price === null || price === undefined) return "";
    const value = Number(price);
    return Number.isInteger(value) ? `$${value}` : `$${value.toFixed(2)}`;
  });

  eleventyConfig.addShortcode("year", () => String(new Date().getFullYear()));

  // total dish count for a menu category (items + subcategories + extras)
  eleventyConfig.addFilter("itemCount", (category) => {
    let n = (category.items || []).length;
    (category.subcategories || []).forEach(s => { n += (s.items || []).length; });
    n += (category.extras || []).length;
    return n;
  });

  // thumbnail path for a menu item image ("x.jpg" -> "/pictures/.../x_thumb.jpg")
  eleventyConfig.addFilter("menuThumb", (image, basePath) => {
    return "/" + basePath + image.replace(/\.(jpg|jpeg|png|webp)$/i, "_thumb.$1");
  });

  // schema.org/Menu JSON-LD built from the menu data (rich-result eligible)
  eleventyConfig.addFilter("menuJsonLd", (menu) => {
    const item = (it) => {
      const o = { "@type": "MenuItem", name: it.name };
      if (it.description) o.description = it.description;
      if (it.price != null) {
        o.offers = { "@type": "Offer", price: it.price.toFixed(2), priceCurrency: "CAD" };
      }
      return o;
    };
    const sections = (menu.categories || []).map(cat => {
      const items = [
        ...(cat.items || []),
        ...((cat.subcategories || []).flatMap(s => s.items || []))
      ].map(item);
      return { "@type": "MenuSection", name: cat.name, hasMenuItem: items };
    });
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Menu",
      "@id": "https://rioalto.ca/menu.html#menu",
      name: "Rio Alto Menu",
      inLanguage: "en-CA",
      hasMenuSection: sections
    });
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["html", "njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
