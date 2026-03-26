<!-- pages/terms-of-service.vue -->
<template>
  <div class="min-h-screen bg-gray-50 py-20">
    <div class="max-w-4xl mx-auto px-5">
      <div class="bg-white rounded-2xl shadow-sm p-8 md:p-12">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          {{ t.title }}
        </h1>
        <p class="text-gray-600 mb-8">{{ t.lastUpdated }}: {{ currentDate }}</p>

        <div class="space-y-8 text-gray-700">
          <!-- Introduction -->
          <section>
            <p class="text-lg">{{ t.introduction }}</p>
          </section>

          <!-- Section 1: Acceptance of Terms -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              1. {{ t.acceptanceTitle }}
            </h2>
            <p>{{ t.acceptanceText }}</p>
          </section>

          <!-- Section 2: Service Description -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              2. {{ t.serviceDescriptionTitle }}
            </h2>
            <p class="mb-4">{{ t.serviceDescriptionText }}</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>{{ t.serviceItem1 }}</li>
              <li>{{ t.serviceItem2 }}</li>
              <li>{{ t.serviceItem3 }}</li>
              <li>{{ t.serviceItem4 }}</li>
              <li>{{ t.serviceItem5 }}</li>
            </ul>
          </section>

          <!-- Section 3: Account Registration -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              3. {{ t.registrationTitle }}
            </h2>
            <p class="mb-4">{{ t.registrationText }}</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>{{ t.registrationItem1 }}</li>
              <li>{{ t.registrationItem2 }}</li>
              <li>{{ t.registrationItem3 }}</li>
              <li>{{ t.registrationItem4 }}</li>
            </ul>
          </section>

          <!-- Section 4: Pricing and Payment -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              4. {{ t.pricingTitle }}
            </h2>
            <p class="mb-4">{{ t.pricingText }}</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>{{ t.pricingItem1 }}</li>
              <li>{{ t.pricingItem2 }}</li>
              <li>{{ t.pricingItem3 }}</li>
              <li>{{ t.pricingItem4 }}</li>
              <li>{{ t.pricingItem5 }}</li>
              <li>{{ t.pricingItem6 }}</li>
              <li>{{ t.pricingItem7 }}</li>
            </ul>
            <div
              class="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg"
            >
              <p class="text-sm font-semibold text-yellow-800 mb-2">
                {{ t.importantNote }}
              </p>
              <p class="text-sm text-yellow-700">{{ t.depositNote }}</p>
              <p class="text-sm text-yellow-700 mt-2">{{ t.ivaNote }}</p>
            </div>
          </section>

          <!-- Section 5: Shipping and Delivery -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              5. {{ t.shippingTitle }}
            </h2>
            <p class="mb-4">{{ t.shippingText }}</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>{{ t.shippingItem1 }}</li>
              <li>{{ t.shippingItem2 }}</li>
              <li>{{ t.shippingItem3 }}</li>
              <li>{{ t.shippingItem4 }}</li>
              <li>{{ t.shippingItem5 }}</li>
              <li>{{ t.shippingItem6 }}</li>
              <li>{{ t.shippingItem7 }}</li>
              <li>{{ t.shippingItem8 }}</li>
            </ul>
          </section>

          <!-- Section 5.1: Carrier Claims and Disputes -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              5.1 {{ t.carrierClaimsTitle }}
            </h2>
            <p class="mb-4">{{ t.carrierClaimsText }}</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>{{ t.carrierClaimsItem1 }}</li>
              <li>{{ t.carrierClaimsItem2 }}</li>
              <li>{{ t.carrierClaimsItem3 }}</li>
            </ul>
          </section>

          <!-- Section 6: Prohibited Items -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              6. {{ t.prohibitedTitle }}
            </h2>
            <p class="mb-4">{{ t.prohibitedText }}</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>{{ t.prohibitedItem1 }}</li>
              <li>{{ t.prohibitedItem2 }}</li>
              <li>{{ t.prohibitedItem3 }}</li>
              <li>{{ t.prohibitedItem4 }}</li>
              <li>{{ t.prohibitedItem5 }}</li>
              <li>{{ t.prohibitedItem6 }}</li>
              <li>{{ t.prohibitedItem7 }}</li>
            </ul>
            <p class="mt-4 text-sm italic">{{ t.prohibitedNote }}</p>
          </section>

          <!-- Section 7: Liability and Insurance -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              7. {{ t.liabilityTitle }}
            </h2>
            <p class="mb-4">{{ t.liabilityText }}</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>{{ t.liabilityItem1 }}</li>
              <li>{{ t.liabilityItem2 }}</li>
              <li>{{ t.liabilityItem3 }}</li>
              <li>{{ t.liabilityItem4 }}</li>
            </ul>
          </section>

          <!-- Section 8: Customs and Import Regulations -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              8. {{ t.customsTitle }}
            </h2>
            <p class="mb-4">{{ t.customsText }}</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>{{ t.customsItem1 }}</li>
              <li>{{ t.customsItem2 }}</li>
              <li>{{ t.customsItem3 }}</li>
              <li>{{ t.customsItem4 }}</li>
            </ul>
          </section>

          <!-- Section 9: Package Storage -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              9. {{ t.storageTitle }}
            </h2>
            <p>{{ t.storageText }}</p>
          </section>

          <!-- Section 10: Cancellations and Refunds -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              10. {{ t.cancellationTitle }}
            </h2>
            <p class="mb-4">{{ t.cancellationText }}</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>{{ t.cancellationItem1 }}</li>
              <li>{{ t.cancellationItem2 }}</li>
              <li>{{ t.cancellationItem3 }}</li>
            </ul>
          </section>

          <!-- Section 11: User Conduct -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              11. {{ t.conductTitle }}
            </h2>
            <p class="mb-4">{{ t.conductText }}</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>{{ t.conductItem1 }}</li>
              <li>{{ t.conductItem2 }}</li>
              <li>{{ t.conductItem3 }}</li>
              <li>{{ t.conductItem4 }}</li>
            </ul>
          </section>

          <!-- Section 12: Intellectual Property -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              12. {{ t.intellectualTitle }}
            </h2>
            <p>{{ t.intellectualText }}</p>
          </section>

          <!-- Section 13: Privacy -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              13. {{ t.privacyTitle }}
            </h2>
            <p>
              {{ t.privacyText }}
              <NuxtLink
                to="/privacy-policy"
                class="text-primary-500 font-semibold hover:text-primary-600 underline"
              >
                {{ t.privacyLink }} </NuxtLink
              >.
            </p>
          </section>

          <!-- Section 14: Modifications to Service -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              14. {{ t.modificationsTitle }}
            </h2>
            <p>{{ t.modificationsText }}</p>
          </section>

          <!-- Section 15: Termination -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              15. {{ t.terminationTitle }}
            </h2>
            <p class="mb-4">{{ t.terminationText }}</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>{{ t.terminationItem1 }}</li>
              <li>{{ t.terminationItem2 }}</li>
              <li>{{ t.terminationItem3 }}</li>
              <li>{{ t.terminationItem4 }}</li>
            </ul>
          </section>

          <!-- Section 16: Limitation of Liability -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              16. {{ t.limitationTitle }}
            </h2>
            <p>{{ t.limitationText }}</p>
          </section>

          <!-- Section 17: Indemnification -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              17. {{ t.indemnificationTitle }}
            </h2>
            <p>{{ t.indemnificationText }}</p>
          </section>

          <!-- Section 18: Dispute Resolution -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              18. {{ t.disputeTitle }}
            </h2>
            <p>{{ t.disputeText }}</p>
          </section>

          <!-- Section 19: Governing Law -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              19. {{ t.governingLawTitle }}
            </h2>
            <p>{{ t.governingLawText }}</p>
          </section>

          <!-- Section 20: Severability -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              20. {{ t.severabilityTitle }}
            </h2>
            <p>{{ t.severabilityText }}</p>
          </section>

          <!-- Section 21: Entire Agreement -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              21. {{ t.entireAgreementTitle }}
            </h2>
            <p>{{ t.entireAgreementText }}</p>
          </section>

          <!-- Section 22: Contact Information -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              22. {{ t.contactTitle }}
            </h2>
            <p class="mb-4">{{ t.contactText }}</p>
            <div class="mt-4 p-4 bg-gray-100 rounded-lg">
              <p class="font-semibold mb-2">Boxly</p>
              <p>Email: contact@boxly.mx</p>
              <p>WhatsApp: +1 (619) 559-1910</p>
              <p class="mt-2">{{ t.hours }}: {{ t.hoursDetail }}</p>
            </div>
          </section>

          <!-- Acceptance Statement -->
          <section class="pt-6 border-t-2 border-gray-200">
            <p class="text-sm italic text-gray-600">
              {{ t.acceptanceStatement }}
            </p>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { t: createTranslations } = useLanguage();

const currentDate = new Date().toLocaleDateString("es-MX", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const translations = {
  title: {
    es: "Términos de Servicio",
    en: "Terms of Service",
  },
  lastUpdated: {
    es: "Última actualización",
    en: "Last updated",
  },
  introduction: {
    es: 'Bienvenido a Boxly. Estos Términos de Servicio ("Términos") rigen su uso de nuestros servicios de consolidación y reenvío de paquetes desde Estados Unidos a México. Al usar nuestros servicios, usted acepta estos Términos en su totalidad.',
    en: 'Welcome to Boxly. These Terms of Service ("Terms") govern your use of our package consolidation and forwarding services from the United States to Mexico. By using our services, you agree to these Terms in their entirety.',
  },
  acceptanceTitle: {
    es: "Aceptación de los Términos",
    en: "Acceptance of Terms",
  },
  acceptanceText: {
    es: "Al crear una cuenta y usar los servicios de Boxly, usted confirma que ha leído, entendido y acepta estar legalmente vinculado por estos Términos. Si no está de acuerdo con estos Términos, no utilice nuestros servicios. Debe ser mayor de 18 años para usar Boxly.",
    en: "By creating an account and using Boxly services, you confirm that you have read, understood, and agree to be legally bound by these Terms. If you do not agree to these Terms, do not use our services. You must be at least 18 years old to use Boxly.",
  },
  serviceDescriptionTitle: {
    es: "Descripción del Servicio",
    en: "Service Description",
  },
  serviceDescriptionText: {
    es: "Boxly proporciona los siguientes servicios:",
    en: "Boxly provides the following services:",
  },
  serviceItem1: {
    es: "Dirección personal de envío en San Diego, California, Estados Unidos",
    en: "Personal shipping address in San Diego, California, United States",
  },
  serviceItem2: {
    es: "Recepción y almacenamiento temporal de paquetes en nuestro almacén",
    en: "Reception and temporary storage of packages at our warehouse",
  },
  serviceItem3: {
    es: "Consolidación de múltiples paquetes en un solo envío",
    en: "Consolidation of multiple packages into a single shipment",
  },
  serviceItem4: {
    es: "Reenvío de paquetes consolidados desde Estados Unidos a México",
    en: "Forwarding of consolidated packages from the United States to Mexico",
  },
  serviceItem5: {
    es: "Gestión de documentación aduanal y entrega a domicilio en México",
    en: "Customs documentation management and home delivery in Mexico",
  },
  registrationTitle: {
    es: "Registro de Cuenta",
    en: "Account Registration",
  },
  registrationText: {
    es: "Para usar nuestros servicios, debe:",
    en: "To use our services, you must:",
  },
  registrationItem1: {
    es: "Crear una cuenta proporcionando información precisa y completa",
    en: "Create an account by providing accurate and complete information",
  },
  registrationItem2: {
    es: "Mantener la confidencialidad de sus credenciales de inicio de sesión",
    en: "Maintain the confidentiality of your login credentials",
  },
  registrationItem3: {
    es: "Notificarnos inmediatamente sobre cualquier uso no autorizado de su cuenta",
    en: "Notify us immediately of any unauthorized use of your account",
  },
  registrationItem4: {
    es: "Ser responsable de todas las actividades bajo su cuenta",
    en: "Be responsible for all activities under your account",
  },
  pricingTitle: {
    es: "Precios y Pagos",
    en: "Pricing and Payments",
  },
  pricingText: {
    es: "Nuestro modelo de precios funciona de la siguiente manera:",
    en: "Our pricing model works as follows:",
  },
  pricingItem1: {
    es: "El registro de cuenta es gratuito",
    en: "Account registration is free",
  },
  pricingItem2: {
    es: "Los precios de envío se basan en el tamaño de la caja (XS, S, M, L, XL)",
    en: "Shipping prices are based on box size (XS, S, M, L, XL)",
  },
  pricingItem3: {
    es: "Los precios son fijos y transparentes, sin cargos ocultos",
    en: "Prices are fixed and transparent, with no hidden charges",
  },
  pricingItem4: {
    es: "Se requiere el pago completo (100%) del costo total antes de que su paquete sea procesado y enviado",
    en: "Full payment (100%) of the total cost is required before your package is processed and shipped",
  },
  pricingItem5: {
    es: "El pago cubre los costos de consolidación, documentación aduanal y envío nacional vía Estafeta o DHL",
    en: "Payment covers consolidation, customs documentation, and domestic shipping via Estafeta or DHL",
  },
  pricingItem6: {
    es: "Una vez realizado el pago y generada la guía de envío, no se aceptan reembolsos",
    en: "Once payment is made and the shipping label is generated, no refunds are accepted",
  },
  pricingItem7: {
    es: "Todos los pagos se procesan de manera segura a través de Stripe",
    en: "All payments are processed securely through Stripe",
  },
  importantNote: {
    es: "Nota Importante:",
    en: "Important Note:",
  },
  depositNote: {
    es: "El pago completo del 100% es obligatorio antes de procesar y enviar su paquete. Este pago no es reembolsable una vez que el envío ha sido procesado y se ha generado la guía de Estafeta o DHL. El pago cubre consolidación, documentación aduanal, cruce de frontera por Tijuana, y envío nacional.",
    en: "Full 100% payment is mandatory before processing and shipping your package. This payment is non-refundable once the shipment has been processed and the Estafeta or DHL tracking number has been generated. Payment covers consolidation, customs documentation, border crossing through Tijuana, and domestic shipping.",
  },
  ivaNote: {
    es: "Todos los precios están sujetos a IVA (Impuesto al Valor Agregado) del 16% según lo establecido por las leyes fiscales mexicanas. El IVA se agregará al costo total del servicio y se reflejará en su factura final.",
    en: "All prices are subject to IVA (Value Added Tax) of 16% as established by Mexican tax laws. IVA will be added to the total service cost and reflected in your final invoice.",
  },
  shippingTitle: {
    es: "Envío, Entrega y Responsabilidad del Transportista",
    en: "Shipping, Delivery and Carrier Liability",
  },
  shippingText: {
    es: "Términos de envío y entrega:",
    en: "Shipping and delivery terms:",
  },
  shippingItem1: {
    es: "Los tiempos de entrega estimados son de 3-5 días hábiles desde que se procesa su envío a través de Estafeta o DHL",
    en: "Estimated delivery times are 3-5 business days from when your shipment is processed via Estafeta or DHL",
  },
  shippingItem2: {
    es: "Boxly actúa como intermediario de envío y utiliza Estafeta o DHL como transportistas. Una vez que Boxly genera y proporciona el número de guía (tracking), y el paquete es entregado al transportista, cualquier retraso, pérdida, daño o problema de entrega es responsabilidad exclusiva del transportista (Estafeta o DHL). Boxly NO es responsable por paquetes perdidos, dañados o retrasados una vez entregados al transportista.",
    en: "Boxly acts as a shipping intermediary and uses Estafeta or DHL as carriers. Once Boxly generates and provides the tracking number (guía), and the package is handed to the carrier, any delays, loss, damage, or delivery issues are the sole responsibility of the carrier (Estafeta or DHL). Boxly is NOT responsible for packages lost, damaged, or delayed once handed to the carrier.",
  },
  shippingItem3: {
    es: "Usted es responsable de proporcionar una dirección de entrega completa, precisa y válida en México. Boxly y el transportista (Estafeta/DHL) no son responsables de entregas fallidas debido a direcciones incorrectas, incompletas o inválidas proporcionadas por el cliente",
    en: "You are responsible for providing a complete, accurate, and valid delivery address in Mexico. Boxly and the carrier (Estafeta/DHL) are not responsible for failed deliveries due to incorrect, incomplete, or invalid addresses provided by the customer",
  },
  shippingItem4: {
    es: "Boxly no es responsable de retrasos causados por aduanas, condiciones climáticas, desastres naturales, huelgas, pandemias, restricciones gubernamentales, o cualquier otra circunstancia de fuerza mayor fuera de nuestro control",
    en: "Boxly is not responsible for delays caused by customs, weather conditions, natural disasters, strikes, pandemics, government restrictions, or any other force majeure circumstances beyond our control",
  },
  shippingItem5: {
    es: "Una vez que el transportista (Estafeta/DHL) marca su paquete como 'entregado', Boxly no tiene responsabilidad sobre reclamos de no recepción. Cualquier disputa de entrega debe manejarse directamente con el transportista",
    en: "Once the carrier (Estafeta/DHL) marks your package as 'delivered', Boxly has no liability for claims of non-receipt. Any delivery disputes must be handled directly with the carrier",
  },
  shippingItem6: {
    es: "Boxly proporcionará el número de guía (tracking) de Estafeta o DHL una vez que el paquete sea enviado. Es su responsabilidad rastrear su paquete y estar disponible para recibirlo",
    en: "Boxly will provide the Estafeta or DHL tracking number (guía) once the package is shipped. It is your responsibility to track your package and be available to receive it",
  },
  shippingItem7: {
    es: "Si el transportista no puede entregar su paquete debido a dirección incorrecta, ausencia del destinatario, o rechazo de entrega, usted será responsable de cualquier cargo adicional de reenvío o almacenamiento",
    en: "If the carrier cannot deliver your package due to incorrect address, recipient absence, or delivery refusal, you will be responsible for any additional reshipment or storage charges",
  },
  shippingItem8: {
    es: "Boxly no ofrece garantías sobre tiempos de entrega específicos. Las estimaciones de 3-5 días hábiles son aproximadas y pueden variar según la ubicación, temporada y circunstancias del transportista. Importante: No realizamos envíos los viernes.",
    en: "Boxly does not provide guarantees on specific delivery times. The 3-5 business day estimate is approximate and may vary based on location, season, and carrier circumstances. Important: We do not ship on Fridays.",
  },
  carrierClaimsTitle: {
    es: "¿Qué pasa si mi paquete se daña o se pierde?",
    en: "What happens if my package is damaged or lost?",
  },
  carrierClaimsText: {
    es: "Política de seguro y reclamos:",
    en: "Insurance and claims policy:",
  },
  carrierClaimsItem1: {
    es: "BOXLY no ofrece seguro directo sobre los envíos. El cliente puede contratar un seguro adicional directamente con la paquetería correspondiente, como DHL o Estafeta, sujeto a sus propios términos y condiciones",
    en: "BOXLY does not offer direct insurance on shipments. The customer may purchase additional insurance directly with the corresponding carrier, such as DHL or Estafeta, subject to their own terms and conditions",
  },
  carrierClaimsItem2: {
    es: "En caso de daño o pérdida, BOXLY podrá apoyar en el proceso de seguimiento o reclamación; sin embargo, la resolución, tiempos de respuesta y cualquier compensación dependerán exclusivamente de la paquetería o aseguradora",
    en: "In case of damage or loss, BOXLY may assist in the tracking or claims process; however, resolution, response times, and any compensation will depend exclusively on the carrier or insurer",
  },
  carrierClaimsItem3: {
    es: "En caso de no contar con seguro, BOXLY no será responsable por pérdidas o daños durante el transporte",
    en: "In the absence of insurance, BOXLY will not be responsible for losses or damages during transport",
  },
  carrierClaimsItem4: {
    es: "",
    en: "",
  },
  carrierClaimsItem5: {
    es: "",
    en: "",
  },
  carrierWarningTitle: {
    es: "",
    en: "",
  },
  carrierWarningText: {
    es: "",
    en: "",
  },
  prohibitedTitle: {
    es: "Artículos Prohibidos",
    en: "Prohibited Items",
  },
  prohibitedText: {
    es: "Los siguientes artículos NO pueden ser enviados a través de Boxly:",
    en: "The following items CANNOT be shipped through Boxly:",
  },
  prohibitedItem1: {
    es: "Sustancias ilegales, drogas o narcóticos",
    en: "Illegal substances, drugs, or narcotics",
  },
  prohibitedItem2: {
    es: "Armas, explosivos, municiones o artículos peligrosos",
    en: "Weapons, explosives, ammunition, or dangerous items",
  },
  prohibitedItem3: {
    es: "Productos perecederos, alimentos o plantas",
    en: "Perishable products, food, or plants",
  },
  prohibitedItem4: {
    es: "Animales vivos o productos de origen animal",
    en: "Live animals or animal products",
  },
  prohibitedItem5: {
    es: "Dinero en efectivo, cheques o instrumentos negociables",
    en: "Cash, checks, or negotiable instruments",
  },
  prohibitedItem6: {
    es: "Productos falsificados o que violen derechos de propiedad intelectual",
    en: "Counterfeit products or those violating intellectual property rights",
  },
  prohibitedItem7: {
    es: "Cualquier artículo prohibido por las leyes de Estados Unidos o México",
    en: "Any items prohibited by United States or Mexico laws",
  },
  prohibitedNote: {
    es: "Nota: Boxly se reserva el derecho de rechazar, retener o destruir cualquier paquete que contenga artículos prohibidos sin previo aviso ni reembolso.",
    en: "Note: Boxly reserves the right to reject, hold, or destroy any package containing prohibited items without prior notice or refund.",
  },
  liabilityTitle: {
    es: "¿Qué garantías incluye el servicio?",
    en: "What guarantees does the service include?",
  },
  liabilityText: {
    es: "BOXLY ofrece un servicio de recepción, consolidación y coordinación logística de envíos internacionales.",
    en: "BOXLY offers a reception, consolidation, and international shipping logistics coordination service.",
  },
  liabilityItem1: {
    es: "BOXLY es responsable del manejo de los paquetes únicamente durante su recepción y proceso de consolidación en nuestras instalaciones",
    en: "BOXLY is responsible for package handling only during reception and the consolidation process at our facilities",
  },
  liabilityItem2: {
    es: "Una vez que los envíos son entregados a terceros para su cruce o transporte (incluyendo paqueterías y proveedores logísticos), la responsabilidad recae en dichos proveedores",
    en: "Once shipments are handed to third parties for crossing or transport (including carriers and logistics providers), responsibility falls on those providers",
  },
  liabilityItem3: {
    es: "BOXLY no ofrece garantías de entrega ni seguros incluidos",
    en: "BOXLY does not offer delivery guarantees or included insurance",
  },
  liabilityItem4: {
    es: "El cliente podrá contratar cobertura adicional directamente con la paquetería correspondiente, como DHL o Estafeta, bajo sus propios términos y condiciones",
    en: "The customer may purchase additional coverage directly with the corresponding carrier, such as DHL or Estafeta, under their own terms and conditions",
  },
  customsTitle: {
    es: "Aduanas y Regulaciones de Importación",
    en: "Customs and Import Regulations",
  },
  customsText: {
    es: "Responsabilidades aduanales:",
    en: "Customs responsibilities:",
  },
  customsItem1: {
    es: "Usted es responsable de cumplir con todas las leyes de importación de México",
    en: "You are responsible for complying with all Mexico import laws",
  },
  customsItem2: {
    es: "Boxly proporciona documentación aduanal (GIA), pero no garantiza la aprobación aduanal",
    en: "Boxly provides customs documentation (GIA), but does not guarantee customs approval",
  },
  customsItem3: {
    es: "Usted es responsable de cualquier impuesto, arancel o tarifa aduanal aplicable",
    en: "You are responsible for any applicable taxes, duties, or customs fees",
  },
  customsItem4: {
    es: "Los paquetes retenidos o confiscados por aduanas no son responsabilidad de Boxly",
    en: "Packages held or confiscated by customs are not Boxly's responsibility",
  },
  storageTitle: {
    es: "¿Hay una fecha de vencimiento para mi dirección o mis paquetes?",
    en: "Is there an expiration date for my address or packages?",
  },
  storageText: {
    es: "El servicio de dirección en EE.UU. es de uso indefinido; sin embargo, los paquetes recibidos deberán ser procesados y enviados dentro de un plazo máximo de 60 días naturales a partir de su recepción. En caso de que un paquete permanezca sin movimiento o sin instrucciones por parte del cliente durante este periodo, BOXLY se reserva el derecho de disponer de la mercancía, incluyendo su desecho, donación o liquidación, sin responsabilidad alguna. BOXLY no será responsable por paquetes no reclamados o sin instrucciones después de este plazo. Adicionalmente, la cuenta podrá ser suspendida o desactivada en caso de inactividad prolongada o incumplimiento en los términos del servicio.",
    en: "The U.S. address service is for indefinite use; however, received packages must be processed and shipped within a maximum period of 60 calendar days from their reception. If a package remains without movement or instructions from the customer during this period, BOXLY reserves the right to dispose of the merchandise, including disposal, donation, or liquidation, without any liability. BOXLY will not be responsible for unclaimed packages or packages without instructions after this period. Additionally, the account may be suspended or deactivated in case of prolonged inactivity or non-compliance with the terms of service.",
  },
  cancellationTitle: {
    es: "Cancelaciones y Reembolsos",
    en: "Cancellations and Refunds",
  },
  cancellationText: {
    es: "Política de cancelación:",
    en: "Cancellation policy:",
  },
  cancellationItem1: {
    es: "Puede cancelar una orden de envío ÚNICAMENTE antes de que se procese el pago y se genere la guía de envío",
    en: "You may cancel a shipping order ONLY before payment is processed and the shipping label is generated",
  },
  cancellationItem2: {
    es: "Una vez que se ha realizado el pago y se ha generado la guía (tracking) de Estafeta o DHL, NO se pueden realizar reembolsos bajo ninguna circunstancia",
    en: "Once payment has been made and the Estafeta or DHL tracking number (guía) has been generated, NO refunds can be made under any circumstances",
  },
  cancellationItem3: {
    es: "Los reembolsos solo aplican para órdenes canceladas antes del procesamiento del pago y se procesarán dentro de 7-10 días hábiles",
    en: "Refunds only apply to orders cancelled before payment processing and will be processed within 7-10 business days",
  },
  conductTitle: {
    es: "Conducta del Usuario",
    en: "User Conduct",
  },
  conductText: {
    es: "Usted acepta NO:",
    en: "You agree NOT to:",
  },
  conductItem1: {
    es: "Usar el servicio para actividades ilegales o fraudulentas",
    en: "Use the service for illegal or fraudulent activities",
  },
  conductItem2: {
    es: "Proporcionar información falsa o engañosa",
    en: "Provide false or misleading information",
  },
  conductItem3: {
    es: "Compartir su dirección de Boxly con otras personas",
    en: "Share your Boxly address with other people",
  },
  conductItem4: {
    es: "Abusar del servicio de atención al cliente o personal de Boxly",
    en: "Abuse customer service or Boxly staff",
  },
  intellectualTitle: {
    es: "Propiedad Intelectual",
    en: "Intellectual Property",
  },
  intellectualText: {
    es: "Todo el contenido, marcas comerciales, logotipos y propiedad intelectual en el sitio web y servicios de Boxly son propiedad de Boxly o sus licenciantes. No puede usar, copiar o distribuir ningún contenido sin permiso expreso por escrito.",
    en: "All content, trademarks, logos, and intellectual property on the Boxly website and services are owned by Boxly or its licensors. You may not use, copy, or distribute any content without express written permission.",
  },
  privacyTitle: {
    es: "Privacidad",
    en: "Privacy",
  },
  privacyText: {
    es: "Su privacidad es importante para nosotros. Consulte nuestra",
    en: "Your privacy is important to us. Please review our",
  },
  privacyLink: {
    es: "Política de Privacidad",
    en: "Privacy Policy",
  },
  modificationsTitle: {
    es: "Modificaciones al Servicio",
    en: "Modifications to Service",
  },
  modificationsText: {
    es: "Boxly se reserva el derecho de modificar, suspender o descontinuar cualquier aspecto del servicio en cualquier momento sin previo aviso. También podemos actualizar estos Términos ocasionalmente. El uso continuado del servicio después de cambios constituye su aceptación de los nuevos términos.",
    en: "Boxly reserves the right to modify, suspend, or discontinue any aspect of the service at any time without prior notice. We may also update these Terms occasionally. Continued use of the service after changes constitutes your acceptance of the new terms.",
  },
  terminationTitle: {
    es: "Terminación",
    en: "Termination",
  },
  terminationText: {
    es: "Boxly puede suspender o terminar su cuenta por:",
    en: "Boxly may suspend or terminate your account for:",
  },
  terminationItem1: {
    es: "Violación de estos Términos",
    en: "Violation of these Terms",
  },
  terminationItem2: {
    es: "Actividad fraudulenta o ilegal",
    en: "Fraudulent or illegal activity",
  },
  terminationItem3: {
    es: "Falta de pago",
    en: "Non-payment",
  },
  terminationItem4: {
    es: "Cualquier razón a discreción de Boxly",
    en: "Any reason at Boxly's discretion",
  },
  limitationTitle: {
    es: "Limitación de Responsabilidad",
    en: "Limitation of Liability",
  },
  limitationText: {
    es: "EN LA MEDIDA MÁXIMA PERMITIDA POR LA LEY, BOXLY NO SERÁ RESPONSABLE POR DAÑOS INDIRECTOS, INCIDENTALES, ESPECIALES, CONSECUENTES O PUNITIVOS, INCLUYENDO PERO NO LIMITADO A PÉRDIDA DE GANANCIAS, DATOS, USO, FONDO DE COMERCIO U OTRAS PÉRDIDAS INTANGIBLES, RESULTANTES DE SU USO O INCAPACIDAD DE USAR EL SERVICIO.",
    en: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, BOXLY SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OR INABILITY TO USE THE SERVICE.",
  },
  indemnificationTitle: {
    es: "Indemnización",
    en: "Indemnification",
  },
  indemnificationText: {
    es: "Usted acepta indemnizar, defender y eximir de responsabilidad a Boxly, sus directores, empleados y agentes de cualquier reclamo, demanda, pérdida, responsabilidad y gasto (incluyendo honorarios de abogados) que surjan de su uso del servicio, violación de estos Términos, o violación de cualquier ley o derechos de terceros.",
    en: "You agree to indemnify, defend, and hold harmless Boxly, its directors, employees, and agents from any claims, demands, losses, liabilities, and expenses (including attorney fees) arising from your use of the service, violation of these Terms, or violation of any law or third-party rights.",
  },
  disputeTitle: {
    es: "Resolución de Disputas",
    en: "Dispute Resolution",
  },
  disputeText: {
    es: "Cualquier disputa relacionada con estos Términos o el uso del servicio se intentará resolver primero de manera informal contactando a Boxly. Si no se puede resolver informalmente, ambas partes acuerdan someterse a mediación antes de iniciar cualquier procedimiento legal.",
    en: "Any dispute related to these Terms or use of the service will first be attempted to be resolved informally by contacting Boxly. If it cannot be resolved informally, both parties agree to submit to mediation before initiating any legal proceedings.",
  },
  governingLawTitle: {
    es: "Ley Aplicable",
    en: "Governing Law",
  },
  governingLawText: {
    es: "Estos Términos se regirán e interpretarán de acuerdo con las leyes del Estado de California, Estados Unidos, y las leyes federales aplicables de los Estados Unidos y México, sin tener en cuenta sus disposiciones sobre conflictos de leyes.",
    en: "These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, and applicable federal laws of the United States and Mexico, without regard to its conflict of law provisions.",
  },
  severabilityTitle: {
    es: "Separabilidad",
    en: "Severability",
  },
  severabilityText: {
    es: "Si alguna disposición de estos Términos se considera inválida o inaplicable, esa disposición se eliminará o limitará en la medida mínima necesaria, y las disposiciones restantes de estos Términos continuarán en pleno vigor y efecto.",
    en: "If any provision of these Terms is found to be invalid or unenforceable, that provision will be removed or limited to the minimum extent necessary, and the remaining provisions of these Terms will continue in full force and effect.",
  },
  entireAgreementTitle: {
    es: "Acuerdo Completo",
    en: "Entire Agreement",
  },
  entireAgreementText: {
    es: "Estos Términos, junto con nuestra Política de Privacidad, constituyen el acuerdo completo entre usted y Boxly con respecto a su uso del servicio y reemplazan todos los acuerdos anteriores o contemporáneos, ya sean escritos u orales.",
    en: "These Terms, together with our Privacy Policy, constitute the entire agreement between you and Boxly regarding your use of the service and supersede all prior or contemporaneous agreements, whether written or oral.",
  },
  contactTitle: {
    es: "Información de Contacto",
    en: "Contact Information",
  },
  contactText: {
    es: "Si tiene preguntas sobre estos Términos de Servicio, contáctenos:",
    en: "If you have questions about these Terms of Service, contact us:",
  },
  address: {
    es: "Dirección",
    en: "Address",
  },
  hours: {
    es: "Horario de atención",
    en: "Business hours",
  },
  hoursDetail: {
    es: "Lunes a Viernes 9:00 AM - 6:00 PM, Sábado 10:00 AM - 2:00 PM",
    en: "Monday to Friday 9:00 AM - 6:00 PM, Saturday 10:00 AM - 2:00 PM",
  },
  acceptanceStatement: {
    es: "Al usar los servicios de Boxly, usted reconoce que ha leído, entendido y acepta estar vinculado por estos Términos de Servicio.",
    en: "By using Boxly services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.",
  },
};

const t = createTranslations(translations);
</script>