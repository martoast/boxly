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
  
            <!-- Section 1: Information Collection -->
            <section>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                1. {{ t.informationCollectionTitle }}
              </h2>
              <p class="mb-4">{{ t.informationCollectionText }}</p>
              <ul class="list-disc pl-6 space-y-2">
                <li>{{ t.infoItem1 }}</li>
                <li>{{ t.infoItem2 }}</li>
                <li>{{ t.infoItem3 }}</li>
                <li>{{ t.infoItem4 }}</li>
                <li>{{ t.infoItem5 }}</li>
              </ul>
            </section>
  
            <!-- Section 2: Use of Information -->
            <section>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                2. {{ t.useOfInformationTitle }}
              </h2>
              <p class="mb-4">{{ t.useOfInformationText }}</p>
              <ul class="list-disc pl-6 space-y-2">
                <li>{{ t.useItem1 }}</li>
                <li>{{ t.useItem2 }}</li>
                <li>{{ t.useItem3 }}</li>
                <li>{{ t.useItem4 }}</li>
                <li>{{ t.useItem5 }}</li>
              </ul>
            </section>
  
            <!-- Section 3: Information Protection -->
            <section>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                3. {{ t.protectionTitle }}
              </h2>
              <p class="mb-4">{{ t.protectionText }}</p>
              <ul class="list-disc pl-6 space-y-2">
                <li>{{ t.protectionItem1 }}</li>
                <li>{{ t.protectionItem2 }}</li>
                <li>{{ t.protectionItem3 }}</li>
              </ul>
            </section>
  
            <!-- Section 4: Information Sharing -->
            <section>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                4. {{ t.sharingTitle }}
              </h2>
              <p class="mb-4">{{ t.sharingText }}</p>
              <ul class="list-disc pl-6 space-y-2">
                <li>{{ t.sharingItem1 }}</li>
                <li>{{ t.sharingItem2 }}</li>
                <li>{{ t.sharingItem3 }}</li>
                <li>{{ t.sharingItem4 }}</li>
              </ul>
            </section>
  
            <!-- Section 5: Cookies -->
            <section>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                5. {{ t.cookiesTitle }}
              </h2>
              <p>{{ t.cookiesText }}</p>
            </section>
  
            <!-- Section 6: User Rights -->
            <section>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                6. {{ t.rightsTitle }}
              </h2>
              <p class="mb-4">{{ t.rightsText }}</p>
              <ul class="list-disc pl-6 space-y-2">
                <li>{{ t.rightsItem1 }}</li>
                <li>{{ t.rightsItem2 }}</li>
                <li>{{ t.rightsItem3 }}</li>
                <li>{{ t.rightsItem4 }}</li>
              </ul>
            </section>
  
            <!-- Section 7: Data Retention -->
            <section>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                7. {{ t.retentionTitle }}
              </h2>
              <p>{{ t.retentionText }}</p>
            </section>
  
            <!-- Section 8: International Transfers -->
            <section>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                8. {{ t.internationalTitle }}
              </h2>
              <p>{{ t.internationalText }}</p>
            </section>
  
            <!-- Section 9: Minors -->
            <section>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                9. {{ t.minorsTitle }}
              </h2>
              <p>{{ t.minorsText }}</p>
            </section>
  
            <!-- Section 10: Changes -->
            <section>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                10. {{ t.changesTitle }}
              </h2>
              <p>{{ t.changesText }}</p>
            </section>
  
            <!-- Section 11: Meta integrations -->
            <section>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                11. {{ t.metaTitle }}
              </h2>
              <p class="mb-4">{{ t.metaIntro }}</p>
              <ul class="list-disc pl-6 space-y-2 mb-4">
                <li>{{ t.metaItem1 }}</li>
                <li>{{ t.metaItem2 }}</li>
                <li>{{ t.metaItem3 }}</li>
                <li>{{ t.metaItem4 }}</li>
              </ul>
              <p>{{ t.metaClosing }}</p>
            </section>

            <!-- Section 12: Contact -->
            <section>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                12. {{ t.contactTitle }}
              </h2>
              <p class="mb-4">{{ t.contactText }}</p>
              <div class="mt-4 p-4 bg-gray-100 rounded-lg">
                <p class="font-semibold mb-2">{{ t.contactInfo }}</p>
                <p>Email: contact@boxly.mx</p>
                <p>WhatsApp: +1 (619) 559-1910</p>
                <p class="mt-2">{{ t.hours }}: {{ t.hoursDetail }}</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  const { t: createTranslations } = useLanguage()
  
  const currentDate = new Date().toLocaleDateString('es-MX', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  
  const translations = {
    title: {
      es: 'Política de Privacidad',
      en: 'Privacy Policy'
    },
    lastUpdated: {
      es: 'Última actualización',
      en: 'Last updated'
    },
    introduction: {
      es: 'En nuestra empresa, valoramos y respetamos su privacidad. Esta política describe cómo recopilamos, usamos y protegemos su información personal cuando utiliza nuestros servicios de envío desde Estados Unidos a México.',
      en: 'At our company, we value and respect your privacy. This policy describes how we collect, use, and protect your personal information when you use our shipping services from the United States to Mexico.'
    },
    informationCollectionTitle: {
      es: 'Información que Recopilamos',
      en: 'Information We Collect'
    },
    informationCollectionText: {
      es: 'Recopilamos información que usted nos proporciona directamente, incluyendo:',
      en: 'We collect information that you provide directly to us, including:'
    },
    infoItem1: {
      es: 'Información personal: nombre completo, dirección de correo electrónico, número de teléfono',
      en: 'Personal information: full name, email address, phone number'
    },
    infoItem2: {
      es: 'Información de envío: direcciones de entrega en México',
      en: 'Shipping information: delivery addresses in Mexico'
    },
    infoItem3: {
      es: 'Información de pago: datos de tarjeta de crédito (procesados de forma segura)',
      en: 'Payment information: credit card data (securely processed)'
    },
    infoItem4: {
      es: 'Información de compras: detalles de los productos que recibimos para usted',
      en: 'Purchase information: details of products we receive for you'
    },
    infoItem5: {
      es: 'Comunicaciones: mensajes y consultas que nos envía',
      en: 'Communications: messages and inquiries you send us'
    },
    useOfInformationTitle: {
      es: 'Uso de la Información',
      en: 'Use of Information'
    },
    useOfInformationText: {
      es: 'Utilizamos su información para:',
      en: 'We use your information to:'
    },
    useItem1: {
      es: 'Procesar y gestionar sus envíos',
      en: 'Process and manage your shipments'
    },
    useItem2: {
      es: 'Comunicarnos con usted sobre el estado de sus paquetes',
      en: 'Communicate with you about your package status'
    },
    useItem3: {
      es: 'Procesar pagos y prevenir fraudes',
      en: 'Process payments and prevent fraud'
    },
    useItem4: {
      es: 'Cumplir con las regulaciones aduanales y legales',
      en: 'Comply with customs and legal regulations'
    },
    useItem5: {
      es: 'Mejorar nuestros servicios y atención al cliente',
      en: 'Improve our services and customer support'
    },
    protectionTitle: {
      es: 'Protección de la Información',
      en: 'Information Protection'
    },
    protectionText: {
      es: 'Implementamos medidas de seguridad para proteger su información:',
      en: 'We implement security measures to protect your information:'
    },
    protectionItem1: {
      es: 'Encriptación SSL para todas las transacciones',
      en: 'SSL encryption for all transactions'
    },
    protectionItem2: {
      es: 'Acceso restringido a información personal',
      en: 'Restricted access to personal information'
    },
    protectionItem3: {
      es: 'Monitoreo regular de nuestros sistemas de seguridad',
      en: 'Regular monitoring of our security systems'
    },
    sharingTitle: {
      es: 'Compartir Información',
      en: 'Information Sharing'
    },
    sharingText: {
      es: 'No vendemos su información personal. Compartimos información solo cuando:',
      en: 'We do not sell your personal information. We share information only when:'
    },
    sharingItem1: {
      es: 'Es necesario para completar su envío (transportistas, aduanas)',
      en: 'Necessary to complete your shipment (carriers, customs)'
    },
    sharingItem2: {
      es: 'Es requerido por ley o proceso legal',
      en: 'Required by law or legal process'
    },
    sharingItem3: {
      es: 'Usted nos da su consentimiento explícito',
      en: 'You give us explicit consent'
    },
    sharingItem4: {
      es: 'Es necesario para proteger nuestros derechos o seguridad',
      en: 'Necessary to protect our rights or security'
    },
    cookiesTitle: {
      es: 'Cookies',
      en: 'Cookies'
    },
    cookiesText: {
      es: 'Utilizamos cookies para mejorar su experiencia en nuestro sitio web, recordar sus preferencias y analizar el uso del sitio. Puede configurar su navegador para rechazar cookies, pero esto podría afectar la funcionalidad del sitio.',
      en: 'We use cookies to improve your experience on our website, remember your preferences, and analyze site usage. You can configure your browser to reject cookies, but this may affect site functionality.'
    },
    rightsTitle: {
      es: 'Sus Derechos',
      en: 'Your Rights'
    },
    rightsText: {
      es: 'Usted tiene derecho a:',
      en: 'You have the right to:'
    },
    rightsItem1: {
      es: 'Acceder a su información personal',
      en: 'Access your personal information'
    },
    rightsItem2: {
      es: 'Corregir información incorrecta',
      en: 'Correct incorrect information'
    },
    rightsItem3: {
      es: 'Solicitar la eliminación de su información',
      en: 'Request deletion of your information'
    },
    rightsItem4: {
      es: 'Optar por no recibir comunicaciones promocionales',
      en: 'Opt out of promotional communications'
    },
    retentionTitle: {
      es: 'Retención de Datos',
      en: 'Data Retention'
    },
    retentionText: {
      es: 'Mantenemos su información personal mientras su cuenta esté activa o según sea necesario para proporcionarle servicios. Retenemos y usamos su información según sea necesario para cumplir con nuestras obligaciones legales, resolver disputas y hacer cumplir nuestros acuerdos.',
      en: 'We maintain your personal information while your account is active or as needed to provide you services. We retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements.'
    },
    internationalTitle: {
      es: 'Transferencias Internacionales',
      en: 'International Transfers'
    },
    internationalText: {
      es: 'Su información puede ser transferida y mantenida en servidores ubicados fuera de su país de residencia. Al usar nuestros servicios, usted consiente estas transferencias.',
      en: 'Your information may be transferred to and maintained on servers located outside your country of residence. By using our services, you consent to these transfers.'
    },
    minorsTitle: {
      es: 'Menores de Edad',
      en: 'Minors'
    },
    minorsText: {
      es: 'Nuestros servicios no están dirigidos a personas menores de 18 años. No recopilamos intencionalmente información de menores de edad.',
      en: 'Our services are not directed to persons under 18 years of age. We do not intentionally collect information from minors.'
    },
    changesTitle: {
      es: 'Cambios a esta Política',
      en: 'Changes to this Policy'
    },
    changesText: {
      es: 'Podemos actualizar esta política de privacidad ocasionalmente. Le notificaremos sobre cambios significativos publicando la nueva política en nuestro sitio web.',
      en: 'We may update this privacy policy occasionally. We will notify you of significant changes by posting the new policy on our website.'
    },
    metaTitle: {
      es: 'Integraciones con Meta (Facebook, Messenger e Instagram)',
      en: 'Meta Integrations (Facebook, Messenger, and Instagram)'
    },
    metaIntro: {
      es: 'Boxly se integra con las plataformas de Meta Platforms, Inc. (Facebook, Messenger e Instagram) para operar tu cuenta comercial. Cuando conectas tu página de Facebook, cuenta de Instagram o cuenta publicitaria, accedemos —únicamente con tu autorización— a la siguiente información a través de las APIs oficiales de Meta:',
      en: 'Boxly integrates with the platforms of Meta Platforms, Inc. (Facebook, Messenger, and Instagram) to operate your business account. When you connect your Facebook Page, Instagram account, or ad account, we access —only with your authorization— the following information through Meta\'s official APIs:'
    },
    metaItem1: {
      es: 'Mensajes de Facebook Messenger e Instagram Direct: para mostrar tus conversaciones en una bandeja de entrada unificada y permitir que tú (o tu asistente automatizado) respondas a tus clientes.',
      en: 'Facebook Messenger and Instagram Direct messages: to display your conversations in a unified inbox and allow you (or your automated assistant) to reply to your customers.'
    },
    metaItem2: {
      es: 'Páginas de Facebook: nombre, identificador y metadatos de la página, para vincularla y recibir mensajes y notificaciones.',
      en: 'Facebook Pages: the page name, identifier, and metadata, to link it and receive messages and notifications.'
    },
    metaItem3: {
      es: 'Cuentas publicitarias (Marketing API): campañas, métricas de rendimiento y configuración, para mostrar reportes y permitirte crear y administrar anuncios desde Boxly.',
      en: 'Ad accounts (Marketing API): campaigns, performance metrics, and settings, to show reports and let you create and manage ads from Boxly.'
    },
    metaItem4: {
      es: 'Clientes potenciales de anuncios (Lead Ads): los datos que una persona envía en un formulario de anuncio (nombre, correo, teléfono y respuestas), para registrarlos automáticamente como contactos en tu CRM.',
      en: 'Ad leads (Lead Ads): the data a person submits in an ad form (name, email, phone, and answers), to automatically record them as contacts in your CRM.'
    },
    metaClosing: {
      es: 'Usamos esta información exclusivamente para prestarte el servicio de Boxly. No vendemos esta información ni la compartimos con terceros para fines de publicidad propios. El tratamiento de los datos obtenidos de Meta se realiza conforme a las Condiciones de la Plataforma de Meta (https://developers.facebook.com/terms/). Puedes desconectar tus cuentas de Meta en cualquier momento desde la configuración de Boxly o revocando el acceso desde la configuración de tu cuenta de Facebook; también puedes solicitar la eliminación de estos datos escribiendo a contact@boxly.mx, conforme a la sección de derechos de esta política.',
      en: 'We use this information exclusively to provide you the Boxly service. We do not sell this information nor share it with third parties for our own advertising purposes. Data obtained from Meta is processed in accordance with the Meta Platform Terms (https://developers.facebook.com/terms/). You can disconnect your Meta accounts at any time from your Boxly settings or by revoking access from your Facebook account settings; you may also request deletion of this data by writing to contact@boxly.mx, in accordance with the rights section of this policy.'
    },
    contactTitle: {
      es: 'Contáctenos',
      en: 'Contact Us'
    },
    contactText: {
      es: 'Si tiene preguntas sobre esta política de privacidad o nuestras prácticas de información, contáctenos:',
      en: 'If you have questions about this privacy policy or our information practices, contact us:'
    },
    contactInfo: {
      es: 'Información de Contacto',
      en: 'Contact Information'
    },
    address: {
      es: 'Dirección',
      en: 'Address'
    },
    hours: {
      es: 'Horario de atención',
      en: 'Business hours'
    },
    hoursDetail: {
      es: 'Lunes a Viernes 9:00 AM - 6:00 PM, Sábado 10:00 AM - 2:00 PM',
      en: 'Monday to Friday 9:00 AM - 6:00 PM, Saturday 10:00 AM - 2:00 PM'
    }
  }
  
  const t = createTranslations(translations)
  </script>