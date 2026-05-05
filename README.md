# SVG to Vue (Web)

Convert SVG files into ready-to-use Vue 3 icon components directly in the browser.  
This web app is the quick, no-project-setup companion to the VS Code extension.

[Open the web app](https://svg-vue-web-hlrx-14d65rndo-fukarwork-5039s-projects.vercel.app/)

---

## Features

- Drag-and-drop or browse to upload one or more `.svg` files
- Per-file output with generated Vue SFC component names (`user.svg` -> `UserIcon.vue`)
- Expand/collapse generated code and copy each component with one click
- SVG optimization via SVGO (`preset-default`) before generation
- Geometry-aware `viewBox` derivation (supports transforms and common SVG shapes)
- Root SVG attributes are preserved where safe; sizing is controlled by a `size` prop

---

## How it works

1. Upload SVG files in the app.
2. Each SVG is optimized and parsed in-browser.
3. The app computes/normalizes `viewBox`, applies `fill="currentColor"` to fills, and generates a Vue component.
4. You copy the generated SFC code and paste it into your project.

---

## Local development

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

### Build for production

```bash
npm run build
npm run preview
```

---

## Generated component shape

Each generated icon component follows this pattern:

- Vue 3 `<script setup>`
- `size` prop (`Number | String`, default `24`)
- `<svg :width="size" :height="size">`
- `fill="currentColor"` for easy CSS-driven coloring
- Preserved/derived `viewBox` for reliable scaling

---

## VS Code extension

Need batch generation into an icon system (`src/icons`, registry, and global `<Icon />`)?

- Extension repo: [github.com/Zolfikaar/SVG-Vue](https://github.com/Zolfikaar/SVG-Vue)
- VS Code Marketplace: [SVG to Vue](https://marketplace.visualstudio.com/items?itemName=UrLabs.svg-to-vue)
- [Install directly in VS Code](vscode:extension/UrLabs.svg-to-vue)
