<!-- components/Landing/FAQSection.vue -->
<template>
    <section class="bg-white py-12">
      <div
        class="container mx-auto xl:max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 pt-20 pb-10 px-4 md:px-12 lg:px-5"
      >
        <!-- Left Column - Categories and Header -->
        <div class="grid-col">
          <div class="text-primary-400 font-bold uppercase mb-1">
            {{ t.subtitle }}
          </div>
          <h1
            class="text-dark-500 text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
          >
            {{ t.title }}
          </h1>
          <div class="text-lg text-gray-600 mb-6">
            {{ t.description }}
          </div>
  
          <!-- Category Navigation -->
          <div>
            <div
              v-for="category in categories"
              :key="category.id"
              @click="selectedCategory = category.id"
              :class="[
                'transition duration-300 ease-in-out font-semibold flex items-center group mb-2 px-3 py-2 space-x-2 rounded-lg w-full hover:text-primary-500 hover:bg-gray-50 hover:no-underline cursor-pointer',
                selectedCategory === category.id
                  ? 'text-primary-500 bg-gray-50'
                  : 'text-gray-900',
              ]"
            >
              <component
                :is="category.icon"
                class="w-6 h-6 transition-all"
                :class="
                  selectedCategory === category.id
                    ? 'text-primary-500'
                    : 'text-gray-400 group-hover:text-primary-500'
                "
              />
              <span>{{ category.name[language] }}</span>
            </div>
          </div>
        </div>
  
        <!-- Right Column - FAQ Items -->
        <div class="grid-col divide-y">
          <div v-for="faq in filteredFaqs" :key="faq.id" class="faq-item py-6">
            <button
              @click="toggleFaq(faq.id)"
              class="w-full text-left flex justify-between items-start group"
            >
              <h2
                class="text-gray-700 text-lg font-bold pr-4 group-hover:text-primary-500 transition-colors"
              >
                {{ faq.question[language] }}
              </h2>
              <ChevronDownIcon
                :class="[
                  'w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 mt-1',
                  openFaqs.includes(faq.id) ? 'rotate-180' : '',
                ]"
              />
            </button>
  
            <transition
              enter-active-class="transition duration-300 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-200 ease-out"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <div
                v-show="openFaqs.includes(faq.id)"
                class="text-gray-500 text-justify space-y-4 mt-4"
              >
                <p
                  v-for="(paragraph, index) in faq.answer[language]"
                  :key="index"
                >
                  {{ paragraph }}
                </p>
              </div>
            </transition>
          </div>
          <p class="pt-6 text-gray-600">
            {{ t.termsPrefix }}
            <NuxtLink to="/terms-of-service" class="text-primary-600 hover:underline">{{ t.termsLink }}</NuxtLink>
            {{ t.termsSuffix }}
          </p>
        </div>
      </div>
    </section>
  </template>
  
  <script setup>
  import { ref, computed } from "vue";
  import {
    TruckIcon,
    ShieldCheckIcon,
    ChevronDownIcon,
  } from "@heroicons/vue/24/outline";
  
  const { t: createTranslations, language } = useLanguage();
  
  // State
  const selectedCategory = ref("service");
  const openFaqs = ref([]);
  
  // Translations
  const translations = {
    subtitle: {
      es: "Preguntas Frecuentes",
      en: "Frequently Asked Questions",
    },
    title: {
      es: "¿Tienes preguntas? Podemos ayudarte",
      en: "Do you have questions? We can help",
    },
    description: {
      es: "Encuentra respuestas a las preguntas más comunes sobre nuestro servicio de envíos entre San Diego y Tijuana.",
      en: "Find answers to the most common questions about our shipping service between San Diego and Tijuana.",
    },
    termsPrefix: { es: "Consulta los", en: "See the" },
    termsLink: { es: "Términos de Servicio", en: "Terms of Service" },
    termsSuffix: { es: "para conocer las condiciones completas.", en: "for the full conditions." },
  };
  
  const t = createTranslations(translations);
  
  // Categories — the two groups of the 2026-10-10 legal update (pages 7–8). The full conditions
  // live on /terms-of-service; these answers must never promise more than the terms do.
  const categories = [
    {
      id: "service",
      name: { es: "Servicio", en: "Service" },
      icon: TruckIcon,
    },
    {
      id: "protection",
      name: { es: "Protección y documentos", en: "Protection and documents" },
      icon: ShieldCheckIcon,
    },
  ];

  // FAQ Data — Spanish is the published text, verbatim; English is a faithful translation.
  const faqs = [
    {
      id: 1,
      category: "service",
      question: { es: "¿Cómo funciona?", en: "How does it work?" },
      answer: {
        es: ["Recibe tus compras en tu dirección Boxly de San Diego. Registramos los paquetes y los consolidamos según tus instrucciones para coordinar su traslado a México y envío a tu destino. La modalidad y el precio se confirman al preparar tu caja."],
        en: ["Receive your purchases at your Boxly address in San Diego. We register the packages and consolidate them according to your instructions to coordinate their transfer to Mexico and shipping to your destination. The shipping method and price are confirmed when your box is prepared."],
      },
    },
    {
      id: 2,
      category: "service",
      question: { es: "¿Mi paquete se revisa cuando llega?", en: "Is my package inspected when it arrives?" },
      answer: {
        es: ["Registramos su recepción y condiciones visibles. El servicio ordinario no incluye revisión pieza por pieza ni pruebas de funcionamiento. Si necesitas verificar un artículo o conservar su empaque original, solicítalo antes de consolidar para confirmar si es posible y su costo."],
        en: ["We record its arrival and visible condition. The standard service does not include a piece-by-piece check or functional testing. If you need an item verified or its original packaging kept, ask before consolidation so we can confirm whether it's possible and its cost."],
      },
    },
    {
      id: 3,
      category: "service",
      question: { es: "¿Cuánto tarda?", en: "How long does it take?" },
      answer: {
        es: ["El proceso incluye recepción y preparación, traslado y revisión aduanera, y transporte nacional. La estimación de paquetería comienza cuando recibe físicamente tu caja, no al crear la guía. Te confirmaremos el tiempo estimado para tu modalidad y destino; inspecciones o saturación pueden modificarlo."],
        en: ["The process includes receiving and preparation, transfer and customs review, and domestic transport. The carrier's estimate starts when it physically receives your box, not when the shipping label is created. We'll confirm the estimated time for your shipping method and destination; inspections or congestion can change it."],
      },
    },
    {
      id: 4,
      category: "service",
      question: { es: "¿Por qué mi guía todavía no tiene movimiento?", en: "Why doesn't my tracking number show any movement yet?" },
      answer: {
        es: ["Una guía creada identifica tu envío, pero no confirma por sí sola su recepción por la paquetería. El primer registro puede aparecer después de la entrega física. Si no hay actualización o los datos no coinciden, contáctanos para verificarlo."],
        en: ["A created label identifies your shipment, but on its own it doesn't confirm the carrier has received it. The first scan can appear after the physical handover. If there's no update or the details don't match, contact us so we can check."],
      },
    },
    {
      id: 5,
      category: "service",
      question: { es: "¿Con qué paquetería envían?", en: "Which carriers do you ship with?" },
      answer: {
        es: ["Para terrestre utilizamos Paquetexpress. Para aéreo trabajamos con FedEx, Estafeta y DHL, según disponibilidad, destino y servicio contratado. La opción disponible para tu envío se confirma antes de contratar y te compartimos su guía de seguimiento."],
        en: ["For ground we use Paquetexpress. For air we work with FedEx, Estafeta and DHL, depending on availability, destination and the service booked. The option available for your shipment is confirmed before you book, and we share its tracking number with you."],
      },
    },
    {
      id: 6,
      category: "service",
      question: { es: "¿Cuándo pago?", en: "When do I pay?" },
      answer: {
        es: ["Pagas el envío cuando tu caja está lista y el importe está confirmado, antes de su entrega para transporte nacional. El precio y los conceptos incluidos se informan antes de cobrar. En compras asistidas, el producto y la comisión se pagan conforme a la cotización aceptada."],
        en: ["You pay for shipping when your box is ready and the amount is confirmed, before it's handed over for domestic transport. The price and what it includes are shown before you're charged. For assisted purchases, the product and the fee are paid according to the accepted quote."],
      },
    },
    {
      id: 7,
      category: "service",
      question: { es: "¿Cuánto tiempo puedo almacenar?", en: "How long can I store my packages?" },
      answer: {
        es: ["El plazo ordinario es de 60 días naturales desde el registro de recepción de cada paquete. Solicita una extensión antes del vencimiento si necesitas más tiempo; te confirmaremos disponibilidad y condiciones. No tratamos como abandono los retrasos atribuibles a Boxly."],
        en: ["The standard period is 60 calendar days from when each package is registered as received. Ask for an extension before it expires if you need more time; we'll confirm availability and conditions. Delays caused by Boxly are never treated as abandonment."],
      },
    },
    {
      id: 8,
      category: "protection",
      question: { es: "¿El servicio incluye seguro?", en: "Does the service include insurance?" },
      answer: {
        es: ["No incluye una póliza de seguro por defecto. Si existe protección opcional para tu modalidad, su precio y condiciones se muestran antes de contratar. Debe quedar confirmada para cada caja. No contratarla no elimina tus derechos legales ni las obligaciones propias de Boxly."],
        en: ["It does not include an insurance policy by default. If optional protection exists for your shipping method, its price and conditions are shown before you book. It must be confirmed for each box. Not buying it doesn't remove your legal rights or Boxly's own obligations."],
      },
    },
    {
      id: 9,
      category: "protection",
      question: { es: "¿Qué hago si falta un artículo o llega dañado?", en: "What do I do if an item is missing or arrives damaged?" },
      answer: {
        es: ["Avísanos lo antes posible y conserva caja, etiquetas, sellos y empaque. Comparte tu orden, comprobantes de compra y fotos de cómo recibiste el envío. Si tienes video de apertura, también puede ayudar. Revisaremos la evidencia de recepción, consolidación y transporte para atender el caso."],
        en: ["Let us know as soon as possible and keep the box, labels, seals and packaging. Share your order, proof of purchase and photos of how you received the shipment. An unboxing video can also help, if you have one. We'll review the receiving, consolidation and transport evidence to handle the case."],
      },
    },
    {
      id: 10,
      category: "protection",
      question: { es: "¿Qué comprobante me entrega Boxly?", en: "What receipt does Boxly give me?" },
      answer: {
        es: ["Para servicios contratados con nuestra LLC estadounidense, proporcionamos el comprobante comercial del servicio. No equivale a un CFDI mexicano ni a la factura de los productos comprados en la tienda. Si necesitas documentación fiscal específica, consúltanos antes de contratar."],
        en: ["For services booked with our U.S. LLC, we provide the commercial receipt for the service. It is not a Mexican CFDI, nor the invoice for the products you bought from the store. If you need specific tax documentation, ask us before booking."],
      },
    },
    {
      id: 11,
      category: "protection",
      question: { es: "¿Qué pasa si dice “entregado” y no recibí?", en: "What if it says “delivered” and I didn't receive it?" },
      answer: {
        es: ["Contáctanos para revisar la prueba de entrega, los datos del destinatario y la dirección. Te ayudaremos con la aclaración correspondiente ante la paquetería."],
        en: ["Contact us so we can review the proof of delivery, the recipient's details and the address. We'll help you raise it with the carrier."],
      },
    },
    {
      id: 12,
      category: "protection",
      question: { es: "¿Puedo cancelar?", en: "Can I cancel?" },
      answer: {
        es: ["Solicítalo cuanto antes. Revisaremos qué servicios ya se realizaron y qué cargos pueden recuperarse. Generar una guía no vuelve automáticamente no reembolsable todo el servicio. Te informaremos el desglose y el importe que corresponda devolver."],
        en: ["Ask as soon as possible. We'll review which services were already performed and which charges can be recovered. Creating a shipping label doesn't automatically make the whole service non-refundable. We'll give you the breakdown and the amount to be refunded."],
      },
    },
    {
      id: 13,
      category: "protection",
      question: { es: "¿Qué productos requieren consulta previa?", en: "Which products need checking with you first?" },
      answer: {
        es: ["Consulta antes de comprar perfumes, líquidos, aerosoles, baterías, alimentos, suplementos u otros productos sujetos a restricciones. No aceptamos mercancía ilegal, armas, explosivos, dinero en efectivo ni productos cuyo manejo esté prohibido."],
        en: ["Ask before buying perfumes, liquids, aerosols, batteries, food, supplements or other restricted products. We don't accept illegal goods, weapons, explosives, cash or products whose handling is prohibited."],
      },
    },
    {
      id: 14,
      category: "protection",
      question: { es: "¿Puedo solicitar documentación a mi nombre para reventa?", en: "Can I request documentation in my name for resale?" },
      answer: {
        es: ["Consúltanos antes de enviar tus compras. La documentación disponible depende del producto y de la operación; el servicio ordinario no promete un pedimento individual a tu nombre. Te confirmaremos qué podemos proporcionar antes de contratar."],
        en: ["Ask us before shipping your purchases. The documentation available depends on the product and the operation; the standard service doesn't promise an individual customs entry (pedimento) in your name. We'll confirm what we can provide before you book."],
      },
    },
  ];

  // Computed
  const filteredFaqs = computed(() => {
    return faqs.filter((faq) => faq.category === selectedCategory.value);
  });
  
  // Methods
  const toggleFaq = (faqId) => {
    const index = openFaqs.value.indexOf(faqId);
    if (index > -1) {
      openFaqs.value.splice(index, 1);
    } else {
      openFaqs.value.push(faqId);
    }
  };
  </script>
  
  <style scoped>
  /* Smooth transitions for FAQ items */
  </style>