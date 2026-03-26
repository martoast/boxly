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
        </div>
      </div>
    </section>
  </template>
  
  <script setup>
  import { ref, computed } from "vue";
  import {
    ArchiveBoxIcon,
    ShoppingCartIcon,
    TruckIcon,
    CreditCardIcon,
    UsersIcon,
    ChevronDownIcon,
  } from "@heroicons/vue/24/outline";
  
  const { t: createTranslations, language } = useLanguage();
  
  // State
  const selectedCategory = ref("locker");
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
  };
  
  const t = createTranslations(translations);
  
  // Categories
  const categories = [
    {
      id: "locker",
      name: { es: "Casillero Virtual", en: "Virtual Locker" },
      icon: ArchiveBoxIcon,
    },
    {
      id: "shopping",
      name: { es: "Compras por Internet", en: "Internet Shopping" },
      icon: ShoppingCartIcon,
    },
    {
      id: "shipping",
      name: { es: "Envíos", en: "Shipping" },
      icon: TruckIcon,
    },
    {
      id: "payment",
      name: { es: "Pagos", en: "Payment" },
      icon: CreditCardIcon,
    },
    {
      id: "liability",
      name: { es: "Responsabilidad", en: "Liability" },
      icon: UsersIcon,
    },
  ];
  
  // FAQ Data
  const faqs = [
    // Virtual Locker FAQs
    {
      id: 1,
      category: "locker",
      question: {
        es: "¿Cómo funciona?",
        en: "How does it work?",
      },
      answer: {
        es: [
          "Cuando te registras, recibes una dirección única en Estados Unidos en San Diego con la cual puedes comenzar a comprar en línea--esta dirección es donde enviarás tus paquetes. Cuando estos paquetes llegan a tu dirección de envío en EE.UU., se procesan para ser enviados internacionalmente. Tan pronto como llegan a Tijuana, nuestros agentes de Boxly se encargan del despacho aduanal y envían los paquetes a tu hogar u oficina.",
        ],
        en: [
          "When you sign up, you receive a unique U.S. address in San Diego with which you can start shopping online--this address is where you'll receive your packages. When these packages arrive at your U.S. shipping address, they are then processed to be shipped internationally. As soon as they arrive in Tijuana, our Boxly agents clear customs and send the packages to your home or office.",
        ],
      },
    },
    {
      id: 2,
      category: "locker",
      question: {
        es: "¿Qué obtengo cuando me registro?",
        en: "What do I get when I register?",
      },
      answer: {
        es: [
          "Una dirección de envío internacional acompañada de una serie de herramientas únicas de Boxly que garantizan el manejo y entrega de tus paquetes comprados en línea. Recibirás servicios de envío internacional a un costo muy favorable y con altos estándares de calidad, cumplimiento y seguridad. Además de estos beneficios, tu dirección física en San Diego recibe, clasifica y envía diariamente los documentos o paquetes recibidos a tu cuenta. Tu dirección física en San Diego también te permite hacer seguimiento de tus órdenes.",
        ],
        en: [
          "An international shipping address accompanied by a series of unique Boxly tools that guarantee the handling and delivery of your packages purchased online. You will receive international shipping services at a very favorable cost and with high quality, compliant, and secure margins. In addition to these benefits, your physical address in San Diego receives, classifies, and ships the documents or packages received to your account daily. Your physical address in San Diego also allows you to follow the tracking of your orders.",
        ],
      },
    },
    {
      id: 3,
      category: "locker",
      question: {
        es: "¿Qué garantías incluye el servicio?",
        en: "What guarantees does the service include?",
      },
      answer: {
        es: [
          "BOXLY ofrece un servicio de recepción, consolidación y coordinación logística de envíos internacionales.",
          "BOXLY es responsable del manejo de los paquetes únicamente durante su recepción y proceso de consolidación en nuestras instalaciones. Una vez que los envíos son entregados a terceros para su cruce o transporte (incluyendo paqueterías y proveedores logísticos), la responsabilidad recae en dichos proveedores.",
          "BOXLY no ofrece garantías de entrega ni seguros incluidos. El cliente podrá contratar cobertura adicional directamente con la paquetería correspondiente, como DHL o Estafeta, bajo sus propios términos y condiciones.",
        ],
        en: [
          "BOXLY offers a reception, consolidation, and international shipping logistics coordination service.",
          "BOXLY is responsible for package handling only during reception and the consolidation process at our facilities. Once shipments are handed to third parties for crossing or transport (including carriers and logistics providers), responsibility falls on those providers.",
          "BOXLY does not offer delivery guarantees or included insurance. The customer may purchase additional coverage directly with the corresponding carrier, such as DHL or Estafeta, under their own terms and conditions.",
        ],
      },
    },
    {
      id: 4,
      category: "locker",
      question: {
        es: "¿Hay una fecha de vencimiento para mi dirección de envío en EE.UU. o para mis paquetes?",
        en: "Is there an expiration date for my U.S. shipping address or my packages?",
      },
      answer: {
        es: [
          "El servicio de dirección en EE.UU. es de uso indefinido; sin embargo, los paquetes recibidos deberán ser procesados y enviados dentro de un plazo máximo de 60 días naturales a partir de su recepción.",
          "En caso de que un paquete permanezca sin movimiento o sin instrucciones por parte del cliente durante este periodo, BOXLY se reserva el derecho de disponer de la mercancía, incluyendo su desecho, donación o liquidación, sin responsabilidad alguna. BOXLY no será responsable por paquetes no reclamados o sin instrucciones después de este plazo.",
          "Adicionalmente, la cuenta podrá ser suspendida o desactivada en caso de inactividad prolongada o incumplimiento en los términos del servicio.",
        ],
        en: [
          "The U.S. address service is for indefinite use; however, received packages must be processed and shipped within a maximum period of 60 calendar days from their reception.",
          "If a package remains without movement or instructions from the customer during this period, BOXLY reserves the right to dispose of the merchandise, including disposal, donation, or liquidation, without any liability. BOXLY will not be responsible for unclaimed packages or packages without instructions after this period.",
          "Additionally, the account may be suspended or deactivated in case of prolonged inactivity or non-compliance with the terms of service.",
        ],
      },
    },
    {
      id: 5,
      category: "locker",
      question: {
        es: "¿Cómo me registro?",
        en: "How do I register?",
      },
      answer: {
        es: [
          "Llena el formulario que aparece en la página de registro. Para abrir una cuenta, debes proporcionar una dirección de correo electrónico válida y una dirección de entrega. Puedes configurar tu método de pago después.",
        ],
        en: [
          "Fill out the form that appears on the Registration page. To open an account, you must provide a valid email address and delivery address. You can set up your payment afterwards.",
        ],
      },
    },
    // Shopping FAQs
    {
      id: 6,
      category: "shopping",
      question: {
        es: "¿Puedo comprar en cualquier tienda en línea?",
        en: "Can I shop at any online store?",
      },
      answer: {
        es: [
          "Sí, puedes comprar en cualquier tienda en línea de Estados Unidos que acepte tu dirección de San Diego. Esto incluye Amazon, eBay, Walmart, Best Buy y miles de otras tiendas. Solo asegúrate de usar tu dirección de Boxly como dirección de envío.",
        ],
        en: [
          "Yes, you can shop at any U.S. online store that accepts your San Diego address. This includes Amazon, eBay, Walmart, Best Buy, and thousands of other stores. Just make sure to use your Boxly address as your shipping address.",
        ],
      },
    },
    {
      id: 7,
      category: "shopping",
      question: {
        es: "¿Cómo consolidan mis compras?",
        en: "How do you consolidate my purchases?",
      },
      answer: {
        es: [
          "Cuando realizas múltiples compras, todas llegan a tu casillero en San Diego. Nosotros las agrupamos en un solo envío para reducir los costos de envío internacional. Esto te permite ahorrar significativamente en comparación con enviar cada paquete por separado.",
        ],
        en: [
          "When you make multiple purchases, they all arrive at your locker in San Diego. We group them into a single shipment to reduce international shipping costs. This allows you to save significantly compared to shipping each package separately.",
        ],
      },
    },
    // Shipping FAQs
    {
      id: 8,
      category: "shipping",
      question: {
        es: "¿Hay restricciones sobre lo que puedo enviar?",
        en: "Are there any restrictions on what I can ship?",
      },
      answer: {
        es: [
          "Los siguientes envíos se consideran restringidos por las aerolíneas (hazmat) y pueden requerir manejo especial para enviar: Perfumes, latas de aerosol, tinta, hielo seco, productos químicos y productos perecederos. Otros artículos prohibidos incluyen dinero en efectivo, joyas, bebidas alcohólicas, armas de fuego y municiones, productos perecederos, animales, medicamentos y tabaco (a menos que cumplan con las leyes específicas de entrada del país específico).",
          "Para estos, consulta con nosotros primero antes de comprarlos.",
          "Los siguientes envíos están prohibidos por las aerolíneas y de ninguna manera pueden ser enviados: Productos inflamables, corrosivos, explosivos, armas y municiones de cualquier tipo. El material pornográfico está estrictamente prohibido.",
        ],
        en: [
          "The following shipments are considered restricted by the airlines (hazmat) and may require special handling to ship: Perfumes, aerosol cans, ink, dry ice, chemical products, and perishable goods. Other prohibited items include cash, jewelry, alcoholic beverages, fire arms and munitions, perishable goods, animals, medicines, and tobacco (unless they comply with the specific laws of entry of the specific country).",
          "For these, please consult with us first before purchasing them.",
          "The following shipments are prohibited by the airlines and by no means can they be shipped: Inflammable goods, corrosives, explosives, weapons and munitions of any kind. Pornographic material is strictly prohibited.",
        ],
      },
    },
    {
      id: 9,
      category: "shipping",
      question: {
        es: "¿Qué documentación se necesita para enviar mis paquetes?",
        en: "What documentation is needed for my packages to ship?",
      },
      answer: {
        es: [
          "Tu compra requiere una Factura Comercial para ser enviada. La factura comercial es necesaria para declarar tus artículos en la Aduana de México. Puedes enviarnos tu factura comercial a través de tu cuenta.",
        ],
        en: [
          "Your purchase requires a Commercial Invoice to ship out. The commercial invoice is needed to declare your items at Mexican Customs. You can send us your commercial invoice through your account.",
        ],
      },
    },
    {
      id: 10,
      category: "shipping",
      question: {
        es: "¿Puedo rastrear mi paquete?",
        en: "Can I track my package?",
      },
      answer: {
        es: [
          "Sí. Puedes rastrear el movimiento de tus paquetes en línea en tu cuenta. También contamos con un sistema de notificación por correo electrónico que te notificará el estado de tus paquetes desde San Diego hasta tu puerta en México.",
        ],
        en: [
          "Yes. You can track the movement of your packages online in your account. We also have an email notification system that will notify you of the status of your packages from San Diego to your door in Mexico.",
        ],
      },
    },
    {
      id: 11,
      category: "shipping",
      question: {
        es: "¿Cuánto tiempo tarda el envío?",
        en: "How long does shipping take?",
      },
      answer: {
        es: [
          "El tiempo de entrega típico es de 5-7 días hábiles desde que tu paquete llega a nuestras instalaciones en San Diego hasta que lo recibes en México. Los tiempos pueden variar dependiendo del despacho aduanal y tu ubicación específica.",
        ],
        en: [
          "Typical delivery time is 5-7 business days from when your package arrives at our San Diego facility until you receive it in Mexico. Times may vary depending on customs clearance and your specific location.",
        ],
      },
    },
    // Payment FAQs
    {
      id: 12,
      category: "payment",
      question: {
        es: "¿Qué métodos de pago aceptan?",
        en: "What payment methods do you accept?",
      },
      answer: {
        es: [
          "Aceptamos tarjetas de crédito y débito (Visa, MasterCard, American Express), transferencias bancarias, y pagos en efectivo en nuestras oficinas en Tijuana. También puedes configurar pagos automáticos para mayor comodidad.",
        ],
        en: [
          "We accept credit and debit cards (Visa, MasterCard, American Express), bank transfers, and cash payments at our Tijuana offices. You can also set up automatic payments for convenience.",
        ],
      },
    },
    {
      id: 13,
      category: "payment",
      question: {
        es: "¿Cuáles son los costos del servicio?",
        en: "What are the service costs?",
      },
      answer: {
        es: [
          "Nuestros precios son muy competitivos. El costo depende del peso y dimensiones de tu paquete. Ofrecemos tarifas preferenciales para envíos consolidados y clientes frecuentes. Puedes calcular el costo exacto usando nuestra calculadora en línea.",
        ],
        en: [
          "Our prices are very competitive. The cost depends on the weight and dimensions of your package. We offer preferential rates for consolidated shipments and frequent customers. You can calculate the exact cost using our online calculator.",
        ],
      },
    },
    // Liability FAQs
    {
      id: 14,
      category: "liability",
      question: {
        es: "¿Qué pasa si mi paquete se daña o pierde?",
        en: "What happens if my package is damaged or lost?",
      },
      answer: {
        es: [
          "BOXLY no ofrece seguro directo sobre los envíos. El cliente puede contratar un seguro adicional directamente con la paquetería correspondiente, como DHL o Estafeta, sujeto a sus propios términos y condiciones.",
          "En caso de daño o pérdida, BOXLY podrá apoyar en el proceso de seguimiento o reclamación; sin embargo, la resolución, tiempos de respuesta y cualquier compensación dependerán exclusivamente de la paquetería o aseguradora.",
          "En caso de no contar con seguro, BOXLY no será responsable por pérdidas o daños durante el transporte.",
        ],
        en: [
          "BOXLY does not offer direct insurance on shipments. The customer may purchase additional insurance directly with the corresponding carrier, such as DHL or Estafeta, subject to their own terms and conditions.",
          "In case of damage or loss, BOXLY may assist in the tracking or claims process; however, resolution, response times, and any compensation will depend exclusively on the carrier or insurer.",
          "In the absence of insurance, BOXLY will not be responsible for losses or damages during transport.",
        ],
      },
    },
    {
      id: 15,
      category: "liability",
      question: {
        es: "¿Quién es responsable de los impuestos y aranceles?",
        en: "Who is responsible for taxes and duties?",
      },
      answer: {
        es: [
          "Como receptor, eres responsable de los impuestos y aranceles de importación aplicables. Nuestro equipo te ayudará con el proceso de despacho aduanal y te informará sobre cualquier cargo adicional antes de la entrega.",
        ],
        en: [
          "As the recipient, you are responsible for applicable import taxes and duties. Our team will help you with the customs clearance process and inform you of any additional charges before delivery.",
        ],
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