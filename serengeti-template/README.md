# Serengeti Lodge Template

A modern, clean hotel/lodge booking website template built with HTML, CSS (TailwindCSS), and vanilla JavaScript.

## Features

- 8 complete pages (Home, About, Accommodation, Room Detail, Blog, Blog Post, Contact, Search Results)
- Clean, minimalist design with teal color scheme
- Fully responsive (mobile-first)
- Modern card-based layouts
- Smooth animations and transitions
- No framework dependencies (vanilla JavaScript)

## Tech Stack

- **HTML5** - Semantic markup
- **TailwindCSS 3.4.17** - Utility-first CSS framework
- **Vanilla JavaScript** - ES6 modules
- **Vite** - Dev server and build tool
- **Unsplash** - Placeholder images

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Runs the development server at `http://localhost:5174`

### Build

```bash
npm run build
```

Builds the project to the `/dist` folder.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
serengeti-template/
├── src/
│   ├── index.html           # Home page
│   ├── about.html           # About page
│   ├── accommodation.html   # Room listing
│   ├── room-single.html     # Room detail
│   ├── contact.html         # Contact page
│   ├── blog.html            # Blog listing
│   ├── post-single.html     # Blog post detail
│   ├── search-results.html  # Search results
│   ├── css/
│   │   ├── main.css         # Tailwind imports
│   │   ├── components.css   # Component styles
│   │   └── utilities.css    # Custom utilities
│   ├── js/
│   │   ├── main.js          # Entry point
│   │   └── modules/         # JavaScript modules
│   ├── data/                # Mock JSON data
│   └── partials/            # HTML component templates
├── public/
│   └── images/              # Static images
├── dist/                    # Build output (generated)
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Color Scheme

- **Primary Teal**: `#00bcd4` - CTAs, buttons, active states
- **Dark Teal**: `#003d4f` - Footer, dark sections
- **Neutral**: Whites, grays, blacks for content

## Design Inspiration

Based on modern hotel booking templates with a focus on:
- Clean, spacious layouts
- High-quality imagery
- Easy-to-use booking interface
- Professional typography
- Subtle animations

## License

MIT

---

**Note**: This is a standalone template project. It can be integrated into the Vilo property website system or used independently.
