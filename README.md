# VERDOR — Single-Estate Olive Oil

**Live:** https://verdor.vercel.app

Website designed & built by [kookyweb](https://kookyweb.vercel.app) — olive-oil estate with a **real-time 3D bottle** scrubbed by scroll.

**Wow moments**
- Preloader with counter + curtain reveal; custom cursor, magnetic buttons, scroll progress bar
- Three.js glass bottle (lathe geometry, physical glass + oil inside, canvas-drawn label, gold cap) with floating 3D olives and leaves
- Pinned **pour scene**: the bottle tips, a live oil stream draws into a ceramic dish, the pool fills and the bottle drains — "% poured" counts with your scroll
- Pinned horizontal harvest gallery with inner-image parallax
- 3D letter-by-letter headline reveals, clip-path image wipes, scrambling labels, tilt cards

Static site, no build step — deploy on Vercel with preset **Other**. GSAP + ScrollTrigger + Lenis + Three.js 0.160 via CDN. Photos via Unsplash.

## Built with Claude

I made this site with [Claude](https://claude.ai) by Anthropic as my coding partner. I described the brand, the look and the animations I wanted, and Claude helped write and refine the code while I directed the design and reviewed every step.

## Run locally

No build step. Serve the folder with any static server, for example:

```bash
npx serve .
```

