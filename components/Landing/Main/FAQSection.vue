<template>
  <section id="faq" class="py-24 px-5 bg-white">
    <div class="max-w-6xl mx-auto px-5 fade-in-section">
      <div class="text-center mb-14 max-w-3xl mx-auto">
        <span class="text-primary-500 font-semibold mb-2.5 block uppercase tracking-wider">{{ t.faqTagline }}</span>
        <h2 class="text-4xl md:text-5xl lg:text-6xl mb-4 font-extrabold text-gray-900 leading-tight">{{ t.faqTitle }}</h2>
      </div>
      <div class="max-w-[800px] mx-auto">
        <div v-for="(faq, index) in faqs" :key="index" class="border-b border-gray-200 last:border-b-0">
          <button
            @click="openFaq = openFaq === index ? -1 : index"
            class="w-full p-5 flex justify-between items-center text-left bg-transparent border-none cursor-pointer text-[1.1rem] font-semibold text-gray-900 hover:text-primary-500"
          >
            <span>{{ faq.question }}</span>
            <svg
              :class="['transition-transform duration-300', openFaq === index ? 'rotate-180' : '']"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div
            v-show="openFaq === index"
            class="overflow-hidden transition-all duration-300"
          >
            <p class="px-5 pb-5 m-0 text-base">{{ faq.answer }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'

const { t: createTranslations, language } = useLanguage()

const openFaq = ref(-1)

const translations = {
  faqTagline: {
    es: 'PREGUNTAS FRECUENTES',
    en: 'FREQUENTLY ASKED QUESTIONS'
  },
  faqTitle: {
    es: 'Resolvemos tus Dudas',
    en: 'Answering Your Doubts'
  }
}

const t = createTranslations(translations)

const faqs = computed(() => {
  return language.value === 'es' ? [
    {
      question: '¿Qué pasa si mi paquete se pierde o se daña?',
      answer: 'Avísanos lo antes posible y conserva caja, etiquetas, sellos y empaque. Comparte tu orden, comprobantes de compra y fotos de cómo recibiste el envío. Revisaremos la evidencia de recepción, consolidación y transporte para atender el caso. El servicio no incluye una póliza de seguro por defecto; si existe protección opcional para tu modalidad, su precio y condiciones se muestran antes de contratar.'
    },
    {
      question: '¿Cuánto tiempo tarda en llegar mi envío?',
      answer: 'El proceso incluye recepción y preparación, traslado y revisión aduanera, y transporte nacional. La estimación de paquetería comienza cuando recibe físicamente tu caja, no al crear la guía. Te confirmaremos el tiempo estimado para tu modalidad y destino; inspecciones o saturación pueden modificarlo.'
    },
    {
      question: '¿Cómo sé que su servicio es confiable?',
      answer: 'Llevamos más de 12 años en la industria brindando un servicio de seguimiento personalizado y sin problemas. Hemos servido a más de mil clientes satisfechos. Nuestra reputación se basa en la transparencia, la comunicación constante y el cuidado de cada envío. Contamos con una bodega física en San Diego y estamos siempre al pendiente de todo el proceso de envío hasta que llega a su destino.'
    }
  ] : [
    {
      question: 'What happens if my package is lost or damaged?',
      answer: 'Let us know as soon as possible and keep the box, labels, seals and packaging. Share your order, proof of purchase and photos of how you received the shipment. We\'ll review the receiving, consolidation and transport evidence to handle the case. The service does not include an insurance policy by default; if optional protection exists for your shipping method, its price and conditions are shown before you book.'
    },
    {
      question: 'How long will my shipment take to arrive?',
      answer: 'The process includes receiving and preparation, transfer and customs review, and domestic transport. The carrier\'s estimate starts when it physically receives your box, not when the label is created. We\'ll confirm the estimated time for your shipping method and destination; inspections or congestion can change it.'
    },
    {
      question: 'How do I know your service is reliable?',
      answer: 'We have been in the industry for over 12 years providing personalized tracking service without issues. We have served more than a thousand satisfied customers. Our reputation is built on transparency, constant communication, and care for each shipment. We have a physical warehouse in San Diego and are always monitoring the entire shipping process until it reaches its destination.'
    }
  ]
})
</script>