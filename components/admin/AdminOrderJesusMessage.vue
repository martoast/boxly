<!-- components/admin/AdminOrderJesusMessage.vue -->
<template>
  <div v-if="show" class="message-overlay" @click.self="$emit('close')">
    <div class="message-container">
      <!-- Header -->
      <div class="message-header">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Mensaje para Jesus</h3>
            <p class="text-sm text-gray-500">Orden #{{ order.order_number }}</p>
          </div>
        </div>
        <button @click="$emit('close')" class="close-btn">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Controls -->
      <div class="message-controls">
        <!-- Shipping Type Toggle -->
        <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-gray-700">Tipo de envío:</span>
          <div class="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              @click="shippingType = 'air'"
              :class="[
                'px-3 py-1.5 text-sm font-medium transition-colors',
                shippingType === 'air' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              ]"
            >
              Avión
            </button>
            <button
              @click="shippingType = 'ground'"
              :class="[
                'px-3 py-1.5 text-sm font-medium transition-colors',
                shippingType === 'ground' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              ]"
            >
              Terrestre
            </button>
          </div>
        </div>

        <!-- Contents Input -->
        <div class="flex items-center gap-3">
          <label class="text-sm font-medium text-gray-700">Contenido:</label>
          <input
            v-model="contents"
            type="text"
            class="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="ej: Productos de belleza"
          >
        </div>

        <!-- Regenerate Button -->
        <button
          @click="regenerateMessage"
          class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Regenerar
        </button>
      </div>

      <!-- Message Textarea -->
      <div class="message-content">
        <textarea
          v-model="messageText"
          class="message-textarea"
          rows="12"
        ></textarea>
      </div>

      <!-- Footer Actions -->
      <div class="message-footer">
        <button @click="$emit('close')" class="btn-secondary">
          Cerrar
        </button>
        <button @click="copyToClipboard" class="btn-primary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {{ copied ? 'Copiado!' : 'Copiar al Portapapeles' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  order: {
    type: Object,
    required: true
  }
})

defineEmits(['close'])

const shippingType = ref('air')
const contents = ref('')
const messageText = ref('')
const copied = ref(false)

// Get full formatted address
const getFullAddress = () => {
  const addr = props.order?.delivery_address
  if (!addr) return ''

  // If we have a full_address string, use it
  if (addr.full_address) {
    return addr.full_address
  }

  // Otherwise build from individual fields
  const parts = []
  if (addr.street) {
    let line = addr.street
    if (addr.exterior_number) line += ` ${addr.exterior_number}`
    if (addr.interior_number) line += `, Interior ${addr.interior_number}`
    parts.push(line)
  }
  if (addr.colonia) parts.push(addr.colonia)
  if (addr.municipio) parts.push(addr.municipio)
  if (addr.estado) parts.push(addr.estado)
  if (addr.postal_code) parts.push(addr.postal_code)

  return parts.join(', ')
}

// Get box dimensions and weight
const getBoxDetails = () => {
  const boxes = props.order?.boxes || []
  if (boxes.length === 0) return { dimensions: '', weight: '' }

  // If single box, show its dimensions
  if (boxes.length === 1) {
    const box = boxes[0]
    const dims = (box.length && box.width && box.height)
      ? `${box.length} × ${box.width} × ${box.height} cm`
      : ''
    const weight = box.weight ? `${box.weight} kg` : ''
    return { dimensions: dims, weight }
  }

  // Multiple boxes - show each box's details
  let totalWeight = 0
  const boxLines = boxes.map((box, idx) => {
    const dims = (box.length && box.width && box.height)
      ? `${box.length} × ${box.width} × ${box.height} cm`
      : ''
    if (box.weight) totalWeight += parseFloat(box.weight) || 0
    return { name: box.box_name || `Caja ${idx + 1}`, dims, weight: box.weight }
  })

  return {
    boxes: boxLines,
    totalWeight: totalWeight > 0 ? `${totalWeight.toFixed(1)} kg` : ''
  }
}

// Generate the message
const generateMessage = () => {
  const name = props.order?.user?.name || ''
  const phone = props.order?.user?.phone || ''
  const address = getFullAddress()
  const boxDetails = getBoxDetails()
  const shipping = shippingType.value === 'air' ? 'Avión FedEx' : 'Terrestre FedEx'

  let message = `Nombre: ${name}\n`
  if (phone) message += `    •    Teléfono: ${phone}\n`
  message += `    •    Dirección: ${address}\n`

  // Handle single or multiple boxes
  if (boxDetails.boxes) {
    // Multiple boxes
    boxDetails.boxes.forEach((box, idx) => {
      message += `    •    Caja ${idx + 1}: ${box.name}\n`
      if (box.dims) message += `         Dimensiones: ${box.dims}\n`
      if (box.weight) message += `         Peso: ${box.weight} kg\n`
    })
    if (boxDetails.totalWeight) {
      message += `    •    Peso Total: ${boxDetails.totalWeight}\n`
    }
  } else {
    // Single box
    if (boxDetails.dimensions) {
      message += `    •    Dimensiones: ${boxDetails.dimensions}\n`
    }
    if (boxDetails.weight) {
      message += `    •    Peso: ${boxDetails.weight}\n`
    }
  }

  message += `    •    Contenido: ${contents.value || '[pendiente]'}\n`
  message += `    •    Envío: ${shipping}`

  return message
}

const regenerateMessage = () => {
  messageText.value = generateMessage()
}

// Initialize message when modal opens
watch(() => props.show, (newVal) => {
  if (newVal) {
    shippingType.value = 'air'
    contents.value = ''
    copied.value = false
    messageText.value = generateMessage()
  }
})

// Update message when shipping type or contents change
watch([shippingType, contents], () => {
  messageText.value = generateMessage()
})

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(messageText.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<style scoped>
.message-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.message-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.close-btn {
  padding: 8px;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #e5e7eb;
}

.message-controls {
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-content {
  padding: 16px 20px;
  flex: 1;
  overflow: auto;
}

.message-textarea {
  width: 100%;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  resize: vertical;
  background: #fafafa;
}

.message-textarea:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.message-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn-secondary {
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f3f4f6;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background: #10b981;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #059669;
}
</style>
