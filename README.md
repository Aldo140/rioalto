# Rio Alto Restaurant Project

## Overview
This project is a static website for the Rio Alto restaurant, designed to provide an engaging online presence. The site features a single-page layout with various sections that highlight the restaurant's offerings, story, and contact information.

## Project Structure
```
RioAlto
├── assets
│   ├── css
│   │   └── styles.css
│   ├── js
│   │   └── script.js
│   └── fonts
├── images        # photos, icons, logo (place logo as images/logo.png or provide preferred name)
├── index.html
├── menu.json     # structured menu data (used by JS)
└── README.md
```

## Files and Directories

- **index.html**: The main HTML file serving as the entry point for the website. It includes sections for:
  - Sticky Navbar
  - Hero Section
  - Signature Items
  - Menu
  - Our Story
  - Sourcing Promise
  - Press & Reviews
  - Visit/Contact
  - Footer

- **assets/css/styles.css**: Contains the CSS styles for the website, including layout, typography, colors, spacing, and responsive design.

- **assets/js/script.js**: Contains JavaScript for interactive elements, including:
  - Sticky navbar behavior
  - Smooth scrolling
  - Tabbed menu functionality
  - Micro-interactions

- **assets/fonts**: Directory for Google Fonts used in the project, including Alfa Slab One, Bebas Neue, Inter, and Montserrat.

- **images**: Directory for all images used in the project, including the logo and menu item photos.
  - Suggested logo filename: `logo.png` placed at `images/logo.png`. If you prefer a different filename or more image assets, tell me and I'll update README and references.

- **menu.json**: New JSON file containing menu data (categories and items with name, description, price, tags). This is intended to be consumed by `assets/js/script.js` to render the menu dynamically. Keep it updated as offerings change.

## Setup Instructions
1. Clone the repository to your local machine.
2. Open the project folder in your preferred code editor.
3. Open `index.html` in a web browser to view the site.
4. Modify CSS and JavaScript files as needed to customize styles and interactions.

## Project Goals
- Create an engaging and user-friendly website for Rio Alto restaurant.
- Ensure the site is responsive and accessible across devices.
- Optimize for performance and SEO to enhance visibility.

## Additional Notes
- Ensure all images are optimized for web use.
- Follow best practices for accessibility to make the site usable for all visitors.
- Regularly update the menu.json file to reflect current offerings.

## Assets & Image Guidelines
- images/logo.png — recommended primary logo (square) at 400×400px (or a horizontal variant like logo-horizontal.png at 300×80px).
- Hero / banner image — place at `images/hero.jpg` or `images/hero.webp`. Recommended size: 1600×900px (serve WebP + JPEG fallbacks). Use < 200 KB when possible.
- Menu item photos — store under `images/menu/` with kebab-case filenames (e.g. `images/menu/river-grill-ribeye.jpg`). Recommended size: 800×600px (thumbnails 600×400px).
- Icons & small assets — use SVG for logos/icons where possible for crisp rendering and smaller sizes.

Image tips
- Provide both WebP and JPEG fallbacks if you use picture element or srcset.
- For responsive images, include 1x/2x sizes and proper width/height attributes to avoid layout shift.

Menu JSON usage
- `menu.json` is the authoritative source for menu content. Each item can include:
  - name, description, price (number), tags (array), image (relative path), id (slug), available (boolean)
- Example usage in assets/js/script.js:
  - fetch('/menu.json') → parse categories → render items and use item.image to construct <img src="...">.

## Starter code added
- index.html, assets/css/styles.css, and assets/js/script.js were added as a minimal starter implementation.
- Menu is driven by menu.json (edit for content). Put images under images/ and menu images under images/menu/ using kebab-case filenames.
- To enable richer visuals (papel picado, textures, hero variants), replace images/hero.jpg and images/logo.png with hi-res optimized assets.

If you want me to:
- Add example rendering code to `assets/js/script.js` to dynamically load `menu.json` into the Menu section, or
- Update `index.html` to include image tags and data hooks,
tell me which and I will prepare the changes.