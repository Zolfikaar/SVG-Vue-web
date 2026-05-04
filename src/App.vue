<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { fileNameToComponentName, parseSvg, generateVueComponent } from './utils/svgToVue.js'

const files = ref([])
const inputEl = ref(null)
const isDragging = ref(false)
const expandedIds = ref(new Set())
const copiedId = ref(null)

function addFilesFromList(fileList) {
  if (!fileList?.length) return
  const next = []
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i]
    if (!file.name.toLowerCase().endsWith('.svg')) continue
    next.push({
      id: `${file.name}-${Date.now()}-${i}`,
      name: file.name,
      file,
      content: '',
    })
  }
  files.value = [...files.value, ...next]
  next.forEach((item) => {
    const r = new FileReader()
    const id = item.id
    r.onload = () => {
      const entry = files.value.find((f) => f.id === id)
      if (entry) entry.content = r.result
    }
    r.readAsText(item.file)
  })
}

const items = computed(() =>
  files.value.map((f) => {
    const parsed = parseSvg(f.content)
    const componentName = fileNameToComponentName(f.name)
    const code =
      parsed ?
        generateVueComponent(componentName, parsed.viewBox, parsed.inner)
        : null
    return {
      id: f.id,
      fileName: f.name,
      componentName: componentName + '.vue',
      code,
      loading: !f.content,
      error: f.content && !parsed ? 'Failed to parse SVG' : null,
    }
  })
)

function onFileChange(e) {
  addFilesFromList(e.target.files)
  e.target.value = ''
}

function remove(id) {
  files.value = files.value.filter((f) => f.id !== id)
  const set = new Set(expandedIds.value)
  set.delete(id)
  expandedIds.value = set
  if (copiedId.value === id) copiedId.value = null
}

function toggleCode(id) {
  const set = new Set(expandedIds.value)
  if (set.has(id)) {
    set.delete(id)
  } else {
    set.add(id)
  }
  expandedIds.value = set
}

function isExpanded(id) {
  return expandedIds.value.has(id)
}

async function copyCode(id, code) {
  try {
    await navigator.clipboard.writeText(code)
    copiedId.value = id
    setTimeout(() => {
      if (copiedId.value === id) {
        copiedId.value = null
      }
    }, 1600)
  } catch (_) { }
}

onMounted(() => {
  const appEl = document.getElementById('app')
  if (!appEl) return

  const handleDragOver = (e) => {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
    isDragging.value = true
    appEl.classList.add('dragging')
  }

  const handleDragLeave = (e) => {
    if (!appEl.contains(e.relatedTarget)) {
      isDragging.value = false
      appEl.classList.remove('dragging')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    isDragging.value = false
    appEl.classList.remove('dragging')
    const list = e.dataTransfer.files
    console.log(list)
    addFilesFromList(list)
  }

  const preventWindowDrag = (e) => {
    e.preventDefault()
  }

  appEl.addEventListener('dragover', handleDragOver)
  appEl.addEventListener('dragleave', handleDragLeave)
  appEl.addEventListener('drop', handleDrop)

  window.addEventListener('dragover', preventWindowDrag)
  window.addEventListener('drop', preventWindowDrag)

  onBeforeUnmount(() => {
    appEl.removeEventListener('dragover', handleDragOver)
    appEl.removeEventListener('dragleave', handleDragLeave)
    appEl.removeEventListener('drop', handleDrop)
    window.removeEventListener('dragover', preventWindowDrag)
    window.removeEventListener('drop', preventWindowDrag)
  })
})
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div>
        <h1>SVG to Vue Component Generator</h1>
        <p class="subtitle">Drop SVG icons and instantly generate Vue components.</p>
      </div>
    </header>

    <section class="upload-section">
      <div
        class="dropzone"
        :class="{ 'dropzone-dragging': isDragging }"
        @click="inputEl && inputEl.click()"
      >
        <div class="dropzone-inner">
          <div class="dropzone-icon" aria-hidden="true">
            <span>⇪</span>
          </div>
          <p class="dropzone-title">Drag &amp; drop SVG files here</p>
          <p class="dropzone-subtitle">or click to browse from your computer</p>
          <p class="dropzone-hint">Only .svg files are supported.</p>
        </div>
        <input
          ref="inputEl"
          class="file-input"
          type="file"
          accept=".svg"
          multiple
          @change="onFileChange"
        />
      </div>
    </section>

    <section class="results-section">
      <template v-if="items.length">
        <h2 class="section-title">Generated components</h2>
        <ul class="list">
          <li v-for="item in items" :key="item.id" class="item">
            <div class="item-head">
              <div class="item-icon" aria-hidden="true">
                <span>◆</span>
              </div>
              <div class="item-meta">
                <div class="file-name">{{ item.fileName }}</div>
                <div class="component-name">{{ item.componentName }}</div>
              </div>
              <div class="item-actions">
                <button
                  type="button"
                  class="text-button"
                  @click="toggleCode(item.id)"
                >
                  {{ isExpanded(item.id) ? 'Hide code' : 'Show code' }}
                </button>
                <button
                  v-if="item.code && !item.loading && !item.error"
                  type="button"
                  class="primary-button"
                  @click="copyCode(item.id, item.code)"
                >
                  {{ copiedId === item.id ? 'Copied' : 'Copy code' }}
                </button>
              </div>
            </div>

            <template v-if="item.loading">
              <p class="muted">Parsing SVG…</p>
            </template>
            <template v-else-if="item.error">
              <p class="error">{{ item.error }}</p>
            </template>
            <template v-else>
              <transition name="collapse">
                <div v-if="isExpanded(item.id)" class="code-wrapper">
                  <pre class="code"><code>{{ item.code }}</code></pre>
                </div>
              </transition>
            </template>
          </li>
        </ul>
      </template>
      <p v-else class="empty">No SVG files uploaded yet.</p>
    </section>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: radial-gradient(circle at top left, #1f2933, #050608);
  color: #f5f5f5;
}

#app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1.5rem;
  transition: background 0.18s ease-out;
}

#app.dragging {
  outline: 3px dashed #42b883;
  outline-offset: 10px;
  background: radial-gradient(circle at top left, #1f2933, #050608);
}

.app {
  width: 100%;
  max-width: 900px;
  background: rgba(8, 10, 14, 0.98);
  border-radius: 18px;
  box-shadow:
    0 18px 60px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(148, 163, 184, 0.15);
  padding: 2.25rem 2rem 2.5rem;
}

@media (max-width: 640px) {
  .app {
    padding: 1.75rem 1.25rem 2rem;
  }
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 1.75rem;
}

h1 {
  font-size: 1.6rem;
  font-weight: 630;
  letter-spacing: 0.01em;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  margin: 0;
  font-size: 0.95rem;
  color: #9ca3af;
}

.upload-section {
  margin-bottom: 2.25rem;
}

.dropzone {
  position: relative;
  border-radius: 14px;
  border: 1.5px dashed rgba(148, 163, 184, 0.5);
  background: radial-gradient(circle at top left, rgba(31, 41, 55, 0.9), rgba(15, 23, 42, 0.95));
  padding: 1.75rem 1.5rem;
  text-align: center;
  cursor: pointer;
  transition:
    border-color 0.16s ease-out,
    box-shadow 0.16s ease-out,
    transform 0.12s ease-out,
    background 0.18s ease-out;
}

.dropzone:hover {
  border-color: #42b883;
  box-shadow: 0 0 0 1px rgba(66, 184, 131, 0.4), 0 18px 40px rgba(0, 0, 0, 0.6);
  transform: translateY(-1px);
}

.dropzone-dragging {
  border-color: #42b883;
  background: radial-gradient(circle at top left, rgba(22, 163, 74, 0.22), rgba(15, 23, 42, 0.98));
  box-shadow:
    0 0 0 1px rgba(66, 184, 131, 0.6),
    0 24px 60px rgba(22, 163, 74, 0.35);
}

.dropzone-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.dropzone-icon {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 0%, #6ee7b7, #22c55e);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #020617;
  font-size: 1.4rem;
  margin-bottom: 0.25rem;
  box-shadow:
    0 10px 30px rgba(16, 185, 129, 0.5),
    0 0 0 1px rgba(15, 23, 42, 0.7);
}

.dropzone-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 520;
}

.dropzone-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: #cbd5f5;
}

.dropzone-hint {
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  color: #9ca3af;
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.results-section {
  margin-top: 0.5rem;
}

.section-title {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 520;
  color: #e5e7eb;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.item {
  border-radius: 12px;
  background: radial-gradient(circle at top right, rgba(31, 41, 55, 0.9), rgba(15, 23, 42, 0.95));
  border: 1px solid rgba(55, 65, 81, 0.9);
  padding: 0.85rem 0.9rem 0.95rem;
}

.item-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.item-icon {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: #9ca3af;
  flex-shrink: 0;
}

.item-meta {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.file-name {
  font-weight: 520;
  font-size: 0.92rem;
  color: #e5e7eb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.component-name {
  font-size: 0.8rem;
  color: #9ca3af;
}

.item-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.primary-button,
.text-button {
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 0.78rem;
  padding: 0.35rem 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
}

.primary-button {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #020617;
  font-weight: 540;
  box-shadow: 0 10px 25px rgba(22, 163, 74, 0.5);
}

.primary-button:hover {
  filter: brightness(1.05);
}

.text-button {
  background: transparent;
  color: #9ca3af;
  padding-inline: 0.4rem;
}

.text-button:hover {
  color: #e5e7eb;
}

.code-wrapper {
  margin-top: 0.6rem;
}

.code {
  margin: 0;
  padding: 0.8rem 0.9rem;
  background: #020617;
  border-radius: 10px;
  border: 1px solid rgba(31, 41, 55, 0.9);
  overflow-x: auto;
  font-size: 0.78rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.code code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
}

.empty {
  margin: 0.5rem 0 0;
  color: #9ca3af;
  font-size: 0.9rem;
}

.muted {
  color: #9ca3af;
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
}

.error {
  color: #fecaca;
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.16s ease-out;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-2px);
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 320px;
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 640px) {
  .app-header {
    flex-direction: column;
  }

  .item-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .item-actions {
    margin-left: 0;
  }
}
</style>
