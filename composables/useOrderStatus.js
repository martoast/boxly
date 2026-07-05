// composables/useOrderStatus.js
export const useOrderStatus = () => {
    const { t: createTranslations } = useLanguage()

    const translations = {
      collecting: { es: 'Agregando Artículos', en: 'Adding Items' },
      awaiting_packages: { es: 'Esperando Paquetes', en: 'Awaiting Packages' },
      packages_complete: { es: 'Paquetes Completos', en: 'Packages Complete' },
      awaiting_payment: { es: 'Pago Pendiente', en: 'Payment Due' },
      paid: { es: 'Pagado', en: 'Paid' },
      processing: { es: 'Procesando', en: 'Processing' },
      shipped: { es: 'Enviado', en: 'Shipped' },
      delivered: { es: 'Entregado', en: 'Delivered' },
      cancelled: { es: 'Cancelado', en: 'Cancelled' },
    }

    const t = createTranslations(translations)

    // Define the correct order for the NEW flow. 'paid' is the FINAL status —
    // we don't track shipping/delivery in-system. (Legacy 'processing'/'shipped'/
    // 'delivered' still have labels/colors below so old orders keep rendering.)
    // collecting → awaiting_packages → packages_complete → awaiting_payment → paid → cancelled
    const statusOrder = [
      'collecting',
      'awaiting_packages',
      'packages_complete',
      'awaiting_payment',
      'paid',
      'cancelled',
    ]

    const getStatusColor = (status) => {
      const colors = {
        collecting: "bg-blue-100 text-blue-700",
        awaiting_packages: "bg-amber-100 text-amber-700",
        packages_complete: "bg-purple-100 text-purple-700",
        awaiting_payment: "bg-orange-100 text-orange-700",
        paid: "bg-emerald-100 text-emerald-700",
        processing: "bg-indigo-100 text-indigo-700",
        shipped: "bg-cyan-100 text-cyan-700",
        delivered: "bg-green-100 text-green-700",
        cancelled: "bg-red-100 text-red-700",
      }
      return colors[status] || "bg-gray-100 text-gray-700"
    }

    const getStatusLabel = (status) => {
      if (!status) return ''
      // Use translation if available, otherwise format snake_case
      return t.value[status] || status.replace(/_/g, ' ').toUpperCase()
    }

    // Helper to get all statuses for dropdowns (in correct order)
    const getAllStatuses = () => {
      return statusOrder.map(key => ({
        value: key,
        label: t.value[key]
      }))
    }

    // ── Customer-facing condensed status (matches the order-detail card/timeline).
    // Keeps the operational getStatusLabel intact for admin views. ──
    const customerT = createTranslations({
      cust_transfer: { es: 'En transferencia a México', en: 'In transfer to Mexico' },
      cust_received: { es: 'Recibido en México', en: 'Received in Mexico' },
      cust_quote: { es: 'Cotización lista', en: 'Quote ready' },
      cust_paid: { es: 'Pagado', en: 'Paid' },
      cust_preparing: { es: 'Preparando envío', en: 'Preparing shipment' },
      cust_shipped: { es: 'Enviado', en: 'Shipped' },
      cust_delivered: { es: 'Entregado', en: 'Delivered' },
      cust_cancelled: { es: 'Cancelado', en: 'Cancelled' },
      cx_awaiting: { es: 'Esperando paquetes', en: 'Awaiting packages' },
      cx_warehouse: { es: 'En bodega', en: 'At warehouse' },
      cx_crossing: { es: 'Cruzando a México', en: 'Crossing to Mexico' },
      cx_ready: { es: 'Listo para recoger', en: 'Ready for pickup' },
      cx_paid: { es: 'Pagado', en: 'Paid' },
      cx_picked: { es: 'Recogido', en: 'Picked up' },
    })

    const SHIPPING_MAP = {
      collecting: ['cust_transfer', 'bg-blue-100 text-blue-700'],
      awaiting_packages: ['cust_transfer', 'bg-blue-100 text-blue-700'],
      packages_complete: ['cust_received', 'bg-blue-100 text-blue-700'],
      awaiting_payment: ['cust_quote', 'bg-amber-100 text-amber-700'],
      paid: ['cust_paid', 'bg-emerald-100 text-emerald-700'],
      processing: ['cust_preparing', 'bg-indigo-100 text-indigo-700'],
      shipped: ['cust_shipped', 'bg-cyan-100 text-cyan-700'],
      delivered: ['cust_delivered', 'bg-green-100 text-green-700'],
      cancelled: ['cust_cancelled', 'bg-red-100 text-red-700'],
    }
    const CROSSING_MAP = {
      collecting: ['cx_awaiting', 'bg-amber-100 text-amber-700'],
      awaiting_packages: ['cx_awaiting', 'bg-amber-100 text-amber-700'],
      packages_complete: ['cx_warehouse', 'bg-purple-100 text-purple-700'],
      processing: ['cx_crossing', 'bg-indigo-100 text-indigo-700'],
      shipped: ['cx_ready', 'bg-cyan-100 text-cyan-700'],
      paid: ['cx_paid', 'bg-emerald-100 text-emerald-700'],
      delivered: ['cx_picked', 'bg-green-100 text-green-700'],
      cancelled: ['cust_cancelled', 'bg-red-100 text-red-700'],
    }

    // Returns { label, badge } for the customer's order list/cards.
    const getCustomerStatus = (order) => {
      const map = order?.order_type === 'crossing' ? CROSSING_MAP : SHIPPING_MAP
      const [key, badge] = map[order?.status] || ['cust_transfer', 'bg-gray-100 text-gray-700']
      return { label: customerT.value[key] || '', badge }
    }

    return {
      getStatusColor,
      getStatusLabel,
      getCustomerStatus,
      getAllStatuses,
      statusOrder
    }
  }