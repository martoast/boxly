<template>
  <div class="md prose prose-sm max-w-none text-gray-800 leading-relaxed" v-html="html" />
</template>

<script setup>
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps({ text: { type: String, default: '' } })

marked.setOptions({ breaks: true, gfm: true })

const html = computed(() => {
  const raw = marked.parse(props.text || '', { async: false })
  // DOMPurify needs a DOM — only sanitize on the client (chat renders client-side).
  if (import.meta.client) {
    const clean = DOMPurify.sanitize(raw, { ADD_ATTR: ['target', 'rel'] })
    // open links in a new tab
    return clean.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ')
  }
  return raw
})
</script>

<style scoped>
.md :deep(p) { margin: 0 0 .5rem; }
.md :deep(p:last-child) { margin-bottom: 0; }
.md :deep(h1), .md :deep(h2), .md :deep(h3) { font-weight: 700; margin: .75rem 0 .35rem; line-height: 1.25; }
.md :deep(h1) { font-size: 1.15rem; }
.md :deep(h2) { font-size: 1.05rem; }
.md :deep(h3) { font-size: .98rem; }
.md :deep(ul), .md :deep(ol) { margin: .35rem 0 .6rem; padding-left: 1.15rem; }
.md :deep(ul) { list-style: disc; }
.md :deep(ol) { list-style: decimal; }
.md :deep(li) { margin: .15rem 0; }
.md :deep(a) { color: #2E6BB7; text-decoration: underline; font-weight: 500; }
.md :deep(strong) { font-weight: 700; color: #111827; }
.md :deep(hr) { border: 0; border-top: 1px solid #e5e7eb; margin: .75rem 0; }
.md :deep(code) { background: #f3f4f6; padding: .1rem .3rem; border-radius: .3rem; font-size: .85em; }
.md :deep(blockquote) { border-left: 3px solid #e5e7eb; padding-left: .75rem; color: #6b7280; margin: .5rem 0; }
</style>
