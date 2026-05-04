# SVG to Vue Components

A small developer tool that converts uploaded SVG files into ready-to-use Vue 3 components.

## Setup

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (e.g. http://localhost:5173).

## Usage

1. Click **Upload SVG files** and select one or more `.svg` files.
2. Each file appears in the list with its generated component name (e.g. `user.svg` → `UserIcon.vue`).
3. The Vue component code is shown in a code block.
4. Click **Copy** to copy the component code to the clipboard.

## Generated component

- Keeps the original `viewBox`.
- Removes `width` and `height` from the SVG.
- Replaces `fill="#000"` (and `fill="black"`) with `fill="currentColor"`.
- Adds a `size` prop (default `24`) for the icon dimensions.
