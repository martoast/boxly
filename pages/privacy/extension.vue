<!--
  Privacy policy for the Boxly Shopper Chrome extension.

  This URL is submitted to the Chrome Web Store, which requires a policy that
  covers the extension specifically — the general /privacy-policy is about the
  forwarding service and says nothing about reading a product page.

  It carries its OWN language toggle rather than using the global one from
  useLanguage(): a Google reviewer arrives cold from the developer console, and
  the policy has to be readable in English without them finding a switch in the
  navbar. Spanish stays the default because shoppers are the other audience.
-->
<template>
  <div class="min-h-screen bg-gray-50 py-20">
    <div class="max-w-3xl mx-auto px-5">
      <div class="bg-white rounded-2xl shadow-sm p-8 md:p-12">
        <div class="flex items-start justify-between gap-4 mb-2">
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900">{{ c.title }}</h1>
          <div class="flex shrink-0 rounded-lg border border-gray-200 overflow-hidden text-sm font-semibold">
            <button
              v-for="opt in ['es', 'en']"
              :key="opt"
              class="px-3 py-1.5 transition-colors"
              :class="lang === opt ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
              @click="lang = opt"
            >
              {{ opt.toUpperCase() }}
            </button>
          </div>
        </div>

        <p class="text-gray-600 mb-8">{{ c.updated }}: {{ effectiveDate }}</p>

        <div class="space-y-9 text-gray-700">
          <p class="text-lg">{{ c.intro }}</p>

          <section v-for="(s, i) in c.sections" :key="i">
            <h2 class="text-xl font-semibold text-gray-900 mb-3">{{ i + 1 }}. {{ s.h }}</h2>
            <p v-if="s.p" class="mb-3">{{ s.p }}</p>
            <ul v-if="s.items" class="list-disc pl-6 space-y-2">
              <li v-for="(item, j) in s.items" :key="j">{{ item }}</li>
            </ul>
            <p v-if="s.after" class="mt-3">{{ s.after }}</p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-3">{{ c.sections.length + 1 }}. {{ c.contactTitle }}</h2>
            <p class="mb-3">{{ c.contactText }}</p>
            <div class="bg-gray-50 rounded-xl p-5">
              <p><strong>Boxly USA LLC</strong></p>
              <p>482 W. San Ysidro Blvd., Suite 5-4, San Ysidro, CA 92173</p>
              <p class="mt-2">
                Email:
                <a href="mailto:contact@boxly.mx" class="text-primary-600 hover:underline">contact@boxly.mx</a>
              </p>
              <p>WhatsApp: +1 (619) 559-1910</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { language } = useLanguage()
const lang = ref(language.value === 'en' ? 'en' : 'es')

// Fixed, not new Date(): a policy dated "today" on every page load looks
// generated, and reviewers read the date as when the terms last changed.
const LAST_UPDATED = '2026-07-29'

const effectiveDate = computed(() =>
  new Date(LAST_UPDATED + 'T12:00:00').toLocaleDateString(lang.value === 'en' ? 'en-US' : 'es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
)

const content = {
  es: {
    title: 'Aviso de privacidad — Extensión Boxly Shopper',
    updated: 'Última actualización',
    intro:
      'Boxly Shopper es una extensión de Chrome que te ayuda a comprar en tiendas de Estados Unidos: cuando abres la página de un producto, compara el precio, busca mejores ofertas y te muestra tu dirección Boxly. Este aviso explica exactamente qué información sale de tu navegador y qué hacemos con ella.',
    sections: [
      {
        h: 'Qué información recopilamos',
        p: 'Cuando abres el panel de Boxly en la página de un producto, enviamos a nuestros servidores únicamente los datos de ese producto:',
        items: [
          'La dirección (URL) de la página del producto que estás viendo, su título, la marca, el precio publicado y la imagen principal.',
          'La moneda y el país de la tienda, para poder comparar el precio de México contra el de Estados Unidos.',
          'Tu nombre y correo electrónico, únicamente si tú eliges conectar tu cuenta Boxly desde boxly.mx. Sirven para armar la dirección de tu casillero con tu número de cliente.',
          'La versión de la extensión, para saber si necesitas actualizar.',
        ],
        after:
          'Las consultas del panel se envían sin identificarte: no incluyen tu nombre, tu correo ni tu sesión de Boxly.',
      },
      {
        h: 'Qué NO recopilamos',
        items: [
          'Tu historial de navegación. Solo se envía información de la página que tienes abierta, y solo cuando esa página es la ficha de un producto.',
          'Contraseñas, datos de tarjetas, CVV o fechas de vencimiento. La extensión nunca lee ni escribe en esos campos.',
          'Lo que escribes en formularios, correos, redes sociales o servicios bancarios.',
          'Datos de sitios excluidos por diseño: boxly.mx, Google, Gmail, YouTube, Facebook, Instagram, X, TikTok y WhatsApp, donde la extensión ni siquiera se ejecuta.',
        ],
      },
      {
        h: 'Cómo usamos la información',
        items: [
          'Buscar el mismo producto en otras tiendas de Estados Unidos y verificar que el precio más bajo sea real antes de mostrártelo.',
          'Comparar el precio de la tienda mexicana contra el de la tienda estadounidense.',
          'Encontrar promociones vigentes de la tienda.',
          'Armar tu dirección de casillero en San Ysidro y, si tú lo pides, llenarla en el formulario de envío.',
          'Crear una solicitud de compra en Boxly cuando tú tocas el botón correspondiente.',
        ],
      },
      {
        h: 'Con quién compartimos la información',
        p: 'Para comparar precios necesitamos consultar servicios externos. Les enviamos datos del producto (título, marca, tienda, dirección de la página), nunca tus datos personales:',
        items: [
          'Google (Gemini) — un modelo de inteligencia artificial que ordena los resultados y descarta los que no corresponden al mismo producto.',
        ],
        after:
          'No vendemos tu información, no la usamos para publicidad y no la compartimos con nadie más, salvo obligación legal.',
      },
      {
        h: 'Cuánto tiempo la conservamos',
        p: 'El resultado de una comparación se guarda unos minutos en caché para que el panel abra rápido si vuelves al mismo producto, y se asocia al producto, no a ti. Tu nombre y correo se guardan solo en tu propio navegador (chrome.storage.local) y no salen de tu equipo salvo para armar tu dirección.',
      },
      {
        h: 'Autocompletado de la dirección',
        p: 'En páginas de pago, la extensión puede llenar tu dirección de casillero al tocar el botón. Ese llenado ocurre completamente dentro de tu navegador: nada de lo que hay en el formulario se envía a Boxly, y los campos de tarjeta, CVV y vencimiento quedan intactos.',
      },
      {
        h: 'Tus derechos y cómo borrar tus datos',
        items: [
          'Puedes desconectar tu cuenta en cualquier momento desde las opciones de la extensión: eso borra tu nombre y correo del navegador.',
          'Al desinstalar la extensión, Chrome elimina todo lo que guardó.',
          'Puedes solicitar acceso, rectificación o eliminación de tus datos escribiendo a contact@boxly.mx.',
        ],
      },
      {
        h: 'Permisos que pide la extensión',
        items: [
          'Acceso a las páginas que visitas: necesario para reconocer la ficha de un producto y mostrar el panel encima. El código se ejecuta en tu navegador y solo actúa cuando detecta un producto.',
          'Almacenamiento: guarda tu nombre y tus preferencias del panel en tu equipo.',
          'Pestaña activa: abre la tienda que elegiste en una pestaña nueva cuando tocas una oferta.',
          'boxly.mx: es el único servidor al que la extensión puede enviar información.',
        ],
      },
      {
        h: 'Cambios a este aviso',
        p: 'Si cambiamos lo que recopilamos o con quién lo compartimos, actualizaremos esta página y la fecha de arriba antes de que el cambio entre en vigor.',
      },
    ],
    contactTitle: 'Contacto',
    contactText: 'Si tienes dudas sobre este aviso o sobre tus datos, escríbenos:',
  },
  en: {
    title: 'Privacy Policy — Boxly Shopper extension',
    updated: 'Last updated',
    intro:
      'Boxly Shopper is a Chrome extension that helps Mexican shoppers buy from US stores: when you open a product page, it compares the price, looks for better offers, and shows you your Boxly US address. This policy explains exactly what leaves your browser and what we do with it.',
    sections: [
      {
        h: 'What we collect',
        p: 'When the Boxly panel opens on a product page, the only data sent to our servers describes that product:',
        items: [
          'The URL of the product page you are viewing, its title, brand, listed price, and main image.',
          "The store's currency and country, so we can compare the Mexican price against the US price.",
          'Your name and email address, only if you choose to connect your Boxly account from boxly.mx. They are used to build your locker address with your customer number.',
          'The extension version, so we know whether you need to update.',
        ],
        after:
          'Panel requests are sent without identifying you: they carry no name, no email address, and no Boxly session.',
      },
      {
        h: 'What we do NOT collect',
        items: [
          'Your browsing history. We only send information about the page currently open, and only when that page is a product listing.',
          'Passwords, card numbers, CVV codes, or expiry dates. The extension never reads or writes those fields.',
          'Anything you type into forms, email, social networks, or banking services.',
          'Data from sites excluded by design: boxly.mx, Google, Gmail, YouTube, Facebook, Instagram, X, TikTok, and WhatsApp, where the extension does not run at all.',
        ],
      },
      {
        h: 'How we use it',
        items: [
          'Find the same product at other US retailers and verify the lowest price is real before showing it to you.',
          'Compare the Mexican storefront price against the US price.',
          "Find the store's active promotions.",
          'Build your San Ysidro locker address and, if you ask, fill it into a shipping form.',
          'Create a Boxly purchase request when you tap that button.',
        ],
      },
      {
        h: 'Who we share it with',
        p: 'Comparing prices requires third-party services. We send them product data (title, brand, store, page URL), never your personal information:',
        items: [
          'Google (Gemini) — an AI model that ranks results and discards listings that are not the same product.',
        ],
        after:
          'We do not sell your information, do not use it for advertising, and do not share it with anyone else except where legally required.',
      },
      {
        h: 'How long we keep it',
        p: 'A comparison result is cached for a few minutes so the panel opens quickly if you return to the same product; the cache is keyed to the product, not to you. Your name and email stay in your own browser (chrome.storage.local) and never leave your device except to build your address.',
      },
      {
        h: 'Address autofill',
        p: 'On checkout pages, the extension can fill in your locker address when you tap the button. That fill happens entirely inside your browser: nothing in the form is sent to Boxly, and card, CVV, and expiry fields are left untouched.',
      },
      {
        h: 'Your rights and how to delete your data',
        items: [
          'You can disconnect your account at any time from the extension options, which erases your name and email from the browser.',
          'Uninstalling the extension makes Chrome delete everything it stored.',
          'You can request access, correction, or deletion of your data by writing to contact@boxly.mx.',
        ],
      },
      {
        h: 'Permissions the extension requests',
        items: [
          'Access to the pages you visit: required to recognise a product listing and render the panel over it. The code runs in your browser and acts only when it detects a product.',
          'Storage: keeps your name and panel preferences on your device.',
          'Active tab: opens the retailer you picked in a new tab when you tap an offer.',
          'boxly.mx: the only server the extension is permitted to send anything to.',
        ],
      },
      {
        h: 'Changes to this policy',
        p: 'If we change what we collect or who we share it with, we will update this page and the date above before the change takes effect.',
      },
    ],
    contactTitle: 'Contact',
    contactText: 'If you have questions about this policy or your data, write to us:',
  },
}

const c = computed(() => content[lang.value])

useHead(() => ({
  title: c.value.title + ' | Boxly',
  meta: [{ name: 'description', content: c.value.intro.slice(0, 160) }],
}))
</script>
