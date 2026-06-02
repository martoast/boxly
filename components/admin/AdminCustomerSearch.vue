<template>
  <div class="relative" ref="container">
    <input
      :value="modelValue"
      @input="onInput"
      @focus="showDropdown = true"
      type="text"
      :placeholder="placeholder"
      class="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
    />
    <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
      <svg v-if="loading" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg>
      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M11 17a6 6 0 100-12 6 6 0 000 12z"/></svg>
    </div>

    <div v-if="showDropdown && customers.length > 0" class="absolute z-20 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 max-h-60 overflow-auto">
      <button
        v-for="c in customers"
        :key="c.id"
        type="button"
        @click="select(c)"
        class="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
      >
        <p class="text-sm font-medium text-gray-900">{{ c.name }}</p>
        <p class="text-xs text-gray-500 mt-0.5">{{ c.email }}<span v-if="c.phone"> • {{ c.phone }}</span></p>
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: String, default: '' },
  endpoint: { type: String, default: '/shopping/customers' },
  placeholder: { type: String, default: 'Buscar cliente por nombre, email o teléfono...' },
})
const emit = defineEmits(['update:modelValue', 'select'])

const { $customFetch } = useNuxtApp()

const customers = ref([])
const loading = ref(false)
const showDropdown = ref(false)
const container = ref(null)
let searchTimer = null

const fetchCustomers = async (search) => {
  loading.value = true
  try {
    const res = await $customFetch(props.endpoint, { query: { search: search || undefined, limit: 20 } })
    customers.value = res.data?.data ?? res.data ?? []
  } catch (e) {
    console.error(e)
    customers.value = []
  } finally {
    loading.value = false
  }
}

const onInput = (e) => {
  const value = e.target.value
  emit('update:modelValue', value)
  showDropdown.value = true
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchCustomers(value), 300)
}

const select = (customer) => {
  emit('update:modelValue', customer.name)
  emit('select', customer)
  showDropdown.value = false
}

const onClickOutside = (e) => {
  if (container.value && !container.value.contains(e.target)) showDropdown.value = false
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>
