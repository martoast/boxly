<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
        <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      </div>
      <div>
        <h2 class="text-lg font-bold text-gray-900">{{ c.title }}</h2>
        <p class="text-xs text-gray-500">{{ c.subtitle }}</p>
      </div>
    </div>

    <div class="px-6 py-5 space-y-5">
      <p class="text-sm text-gray-600 leading-relaxed">{{ c.intro }}</p>

      <!-- The one-time reveal. Shown until dismissed, because this is the only
           moment the secret exists in readable form. -->
      <div v-if="fresh" class="rounded-xl border border-primary-200 bg-primary-50/60 px-4 py-3 space-y-2">
        <p class="text-xs font-bold text-primary-900">{{ c.copyNow }}</p>
        <div class="flex items-stretch gap-2">
          <code class="flex-1 min-w-0 truncate bg-white border border-primary-200 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-800">{{ fresh.key }}</code>
          <button @click="copy(fresh.key, 'key')" class="px-3 rounded-lg border border-primary-200 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold">
            {{ copied === 'key' ? c.copied : c.copy }}
          </button>
        </div>
        <div class="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0L3.16 16.25A2 2 0 005 19z" />
          </svg>
          <span>{{ c.warning }}</span>
        </div>
        <button @click="fresh = null" class="text-xs font-semibold text-primary-700 hover:text-primary-900 underline">{{ c.gotIt }}</button>
      </div>

      <!-- Create -->
      <form @submit.prevent="create" class="space-y-3">
        <div class="flex flex-col sm:flex-row gap-2">
          <input
            v-model="name"
            type="text"
            maxlength="100"
            :placeholder="c.namePlaceholder"
            class="flex-1 rounded-xl border-gray-200 text-sm focus:border-primary-500 focus:ring-primary-500"
          />
          <select v-model="expiry" class="rounded-xl border-gray-200 text-sm focus:border-primary-500 focus:ring-primary-500">
            <option :value="null">{{ c.neverExpires }}</option>
            <option :value="30">{{ c.days(30) }}</option>
            <option :value="90">{{ c.days(90) }}</option>
            <option :value="365">{{ c.days(365) }}</option>
          </select>
          <button
            type="submit"
            :disabled="creating || !name.trim()"
            class="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors text-sm whitespace-nowrap"
          >
            {{ creating ? c.creating : c.create }}
          </button>
        </div>
        <p v-if="error" class="text-xs font-medium text-red-600">{{ error }}</p>
      </form>

      <!-- List -->
      <div>
        <p v-if="loading" class="text-sm text-gray-400">{{ c.loading }}</p>
        <p v-else-if="!keys.length" class="text-sm text-gray-400">{{ c.empty }}</p>
        <ul v-else class="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
          <li v-for="k in keys" :key="k.id" class="flex items-center gap-3 px-4 py-3">
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ k.name }}</p>
              <p class="text-xs text-gray-500">
                {{ k.last_used_at ? c.lastUsed(formatDate(k.last_used_at)) : c.neverUsed }}
                <span v-if="k.expires_at"> · {{ c.expires(formatDate(k.expires_at)) }}</span>
              </p>
            </div>
            <button
              @click="revoke(k)"
              :disabled="revoking === k.id"
              class="text-xs font-semibold text-red-600 hover:text-red-700 underline shrink-0 disabled:text-gray-300"
            >
              {{ revoking === k.id ? c.revoking : c.revoke }}
            </button>
          </li>
        </ul>
      </div>

      <!-- How to use it -->
      <details class="group">
        <summary class="cursor-pointer text-xs font-semibold text-primary-600 hover:text-primary-700">{{ c.howTo }}</summary>
        <div class="mt-2 space-y-2">
          <p class="text-xs text-gray-500">{{ c.howToHint }}</p>
          <pre class="bg-gray-900 text-gray-100 rounded-xl p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">{{ example }}</pre>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup>
const { $customFetch } = useNuxtApp()
const { language } = useLanguage()

const keys = ref([])
const loading = ref(true)
const creating = ref(false)
const revoking = ref(null)
const name = ref('')
const expiry = ref(null)
// The plaintext key, held only until the admin dismisses it. Never refetched —
// the API returns it exactly once, at creation.
const fresh = ref(null)
const error = ref('')
const copied = ref(null)

const apiBase = computed(() => useRuntimeConfig().public.apiUrl || 'https://api.boxly.mx')

const example = computed(() =>
  `curl ${apiBase.value}/admin/orders \\\n  -H "Authorization: Bearer ${fresh.value?.key ?? '<your-key>'}" \\\n  -H "Accept: application/json"`
)

const load = async () => {
  loading.value = true
  try {
    const res = await $customFetch('/me/api-keys')
    keys.value = res.data ?? []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const create = async () => {
  creating.value = true
  error.value = ''
  try {
    const res = await $customFetch('/me/api-keys', {
      method: 'POST',
      body: { name: name.value.trim(), expires_in_days: expiry.value },
    })
    fresh.value = res.data
    name.value = ''
    expiry.value = null
    await load()
  } catch (e) {
    // Surface the reserved-name rule (422) rather than failing silently.
    error.value = e?.data?.errors?.name?.[0] || e?.data?.message || c.value.createFailed
  } finally {
    creating.value = false
  }
}

const revoke = async (k) => {
  if (!confirm(c.value.confirmRevoke(k.name))) return
  revoking.value = k.id
  try {
    await $customFetch(`/me/api-keys/${k.id}`, { method: 'DELETE' })
    await load()
  } catch (e) {
    console.error(e)
  } finally {
    revoking.value = null
  }
}

const copy = async (text, which) => {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = which
    setTimeout(() => { if (copied.value === which) copied.value = null }, 1800)
  } catch (e) {
    console.error(e)
  }
}

const formatDate = (d) => (d ? new Date(d).toLocaleDateString(language.value === 'en' ? 'en-US' : 'es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) : '')

onMounted(load)

const COPY = {
  es: {
    title: 'Claves de API',
    subtitle: 'Acceso programático a tu cuenta de administrador',
    intro: 'Una clave de API te deja hacer desde tu propio código todo lo que puedes hacer aquí como administrador. Trátala como una contraseña.',
    namePlaceholder: 'Nombre (ej. jarvis, script de reportes)',
    neverExpires: 'Sin vencimiento',
    days: (n) => `${n} días`,
    create: 'Crear clave', creating: 'Creando…', createFailed: 'No se pudo crear la clave.',
    copyNow: 'Cópiala ahora — no se volverá a mostrar.',
    copy: 'Copiar', copied: '¡Copiado!', gotIt: 'Listo, ya la copié',
    warning: 'Da acceso completo de administrador a Boxly. No la compartas ni la subas a un repositorio.',
    loading: 'Cargando…', empty: 'Todavía no tienes claves de API.',
    lastUsed: (d) => `Último uso: ${d}`, neverUsed: 'Nunca usada',
    expires: (d) => `Vence el ${d}`,
    revoke: 'Revocar', revoking: 'Revocando…',
    confirmRevoke: (n) => `¿Revocar la clave “${n}”? Todo lo que la use dejará de funcionar de inmediato.`,
    howTo: '¿Cómo se usa?',
    howToHint: 'Mándala en el encabezado Authorization. Llega a los mismos endpoints de administrador que usa esta interfaz.',
  },
  en: {
    title: 'API keys',
    subtitle: 'Programmatic access to your admin account',
    intro: 'An API key lets your own code do everything you can do here as an admin. Treat it like a password.',
    namePlaceholder: 'Name (e.g. jarvis, reporting script)',
    neverExpires: 'Never expires',
    days: (n) => `${n} days`,
    create: 'Create key', creating: 'Creating…', createFailed: 'Could not create the key.',
    copyNow: 'Copy it now — it will not be shown again.',
    copy: 'Copy', copied: 'Copied!', gotIt: 'Got it, copied',
    warning: 'This grants full admin access to Boxly. Don’t share it or commit it to a repository.',
    loading: 'Loading…', empty: 'You don’t have any API keys yet.',
    lastUsed: (d) => `Last used ${d}`, neverUsed: 'Never used',
    expires: (d) => `Expires ${d}`,
    revoke: 'Revoke', revoking: 'Revoking…',
    confirmRevoke: (n) => `Revoke the key “${n}”? Anything using it stops working immediately.`,
    howTo: 'How do I use it?',
    howToHint: 'Send it in the Authorization header. It reaches the same admin endpoints this interface uses.',
  },
}

const c = computed(() => COPY[language.value === 'en' ? 'en' : 'es'])
</script>
