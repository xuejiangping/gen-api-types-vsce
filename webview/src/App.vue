<script setup lang="ts">
declare const acquireVsCodeApi: undefined | (() => {
  postMessage: (message: Record<string, unknown>) => void
})

const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null

function notifyExtension() {
  vscode?.postMessage({ type: 'ready' })
}
</script>

<template>
  <main class="shell">
    <section class="hero">
      <p class="eyebrow">VS Code Extension Template</p>
      <h1>Vue + Vite Webview</h1>
      <p class="summary">
        This template keeps a ready-to-build webview and a small command surface so the next
        extension can start from a clean base.
      </p>
      <button type="button" @click="notifyExtension">Send Message</button>
    </section>

    <section class="grid" aria-label="Template features">
      <article>
        <span>01</span>
        <h2>Extension Command</h2>
        <p>Register commands in <code>src/extension.ts</code> and place handlers in <code>src/commands</code>.</p>
      </article>
      <article>
        <span>02</span>
        <h2>Webview App</h2>
        <p>Edit this Vue app in <code>webview/src</code>, then build it into <code>webview/dist</code>.</p>
      </article>
      <article>
        <span>03</span>
        <h2>Message Bridge</h2>
        <p>Use <code>postMessage</code> and <code>onDidReceiveMessage</code> for webview-extension communication.</p>
      </article>
    </section>
  </main>
</template>
