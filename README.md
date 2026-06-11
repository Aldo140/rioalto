# Rio Alto Restaurant Project

## Overview
This project is a static website for the Rio Alto restaurant, designed to provide an engaging online presence. The site features a multi-page layout (`index.html`, `menu.html`, `gallery.html`) built with [Eleventy (11ty)](https://www.11ty.dev/) to keep components modular while delivering blazing fast static HTML.

## Project Structure
```
RioAlto
├── .eleventy.js      # Eleventy configuration
├── package.json      # Dependencies and build scripts
└── src/              # Source code directory
    ├── _includes/    # Reusable Nunjucks components
    │   ├── base.njk          # Master layout wrapper
    │   ├── header.njk        # Shared navigation
    │   ├── footer.njk        # Shared footer
    │   ├── mobile-menu.njk   # Mobile overlay menu
    │   └── svg-sprites.njk   # Hidden SVG sprite definitions
    ├── assets/
    │   ├── css/
    │   │   ├── styles.css
    │   │   └── gallery.css
    │   └── js/
    │       ├── script.js
    │       ├── gallery.js
    │       └── menu-renderer.js
    ├── pictures/     # Photos, icons, logos, and web-optimized images
    ├── index.html    # Homepage view
    ├── menu.html     # Full dynamically loaded menu view
    ├── gallery.html  # Photo/Video gallery view
    └── menu.json     # Structured menu data (consumed by JS)
```

## Setup Instructions
The site is built using Eleventy to remove HTML duplication. 

1. **Install Dependencies:**
   Ensure Node.js is installed. Run the following command in the root folder to install Eleventy:
   ```bash
   npm install
   ```

2. **Run Local Development Server:**
   To spin up a local server with hot-reloading:
   ```bash
   npm start
   ```
   *The site will be available at `http://localhost:8080/`*

3. **Build for Production:**
   To compile the final static HTML files for deployment (outputs to `_site/`):
   ```bash
   npm run build
   ```

## Development and Architecture Notes

* **Eleventy (`.njk`):** We use Nunjucks layouts to wrap the `HTML` files and inject the shared UI components (Header, Footer, Mobile Menu, SVG Sprites).
* **SVG Sprites:** All SVG graphics are consolidated in `src/_includes/svg-sprites.njk` and referenced across the site using `<use href="#icon-name">`. This significantly slims down the DOM structure.
* **Footer Rendering:** The footer structure is defined in `src/_includes/footer.njk` and `script.js` parses business info to dynamically populate it.
* **Data Sources:** `menu.json` serves as the authoritative source for the restaurant menu. Edit it to update the offerings, and `menu-renderer.js` handles DOM updates automatically.

## Assets & Image Guidelines
- **Logos**: `pictures/logo.png` (secondary logo) and `pictures/logo-full.png` (primary extended logo).
- **Hero Banners**: Reside in `pictures/Rio_alto/web-optimized/`. Provide both WebP and JPEG fallbacks and keep sizes < 200KB when possible.
- **Menu Photos**: Store grouped photos in `pictures/` or `pictures/gallery/`. The JSON expects relative paths.
- **Videos**: Can be housed in `pictures/Rio_alto/` or `pictures/gallery/` and are utilized in `gallery.html` using `<video>` tags with poster fallbacks.
