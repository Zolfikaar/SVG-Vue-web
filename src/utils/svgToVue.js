/**
 * Convert a file name to a Vue component name.
 * user.svg → UserIcon, arrow-right.svg → ArrowRightIcon
 */
export function fileNameToComponentName(fileName) {
  const base = fileName.replace(/\.svg$/i, '').trim()
  if (!base) return 'Icon'
  const pascal = base
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
  return pascal + 'Icon'
}

/**
 * Parse SVG string: extract viewBox, inner content; remove width/height; normalize fill.
 */
export function parseSvg(svgText) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')
  const svg = doc.querySelector('svg')
  if (!svg) return null

  const viewBox = svg.getAttribute('viewBox') || '0 0 24 24'

  // Clone to avoid mutating the parsed document when we get innerHTML
  const clone = svg.cloneNode(true)
  clone.removeAttribute('width')
  clone.removeAttribute('height')

  let inner = clone.innerHTML

  // Replace fill="#000" (and common black variants) with fill="currentColor"
  inner = inner.replace(/\bfill\s*=\s*["']#000(000)?["']/gi, 'fill="currentColor"')
  inner = inner.replace(/\bfill\s*=\s*["']black["']/gi, 'fill="currentColor"')

  return { viewBox, inner }
}

/**
 * Generate Vue 3 SFC code for an icon component.
 */
export function generateVueComponent(componentName, viewBox, innerSvg) {
  // Escape so ${ and ` in SVG content don't break the template literal
  const safeInner = innerSvg.replace(/\$\{/g, '\\${').replace(/`/g, '\\`')
  return `<script setup>
defineProps({
  size: { type: [Number, String], default: 24 }
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="${viewBox}"
    fill="currentColor"
  >
    ${safeInner}
  </svg>
</template>
`
}
