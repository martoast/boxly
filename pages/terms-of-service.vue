<!-- pages/terms-of-service.vue -->
<template>
  <div class="min-h-screen bg-gray-50 py-20">
    <div class="max-w-4xl mx-auto px-5">
      <div class="bg-white rounded-2xl shadow-sm p-8 md:p-12">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Términos de Servicio de Boxly</h1>
        <p class="text-gray-600">Última actualización: {{ TERMS_PUBLISHED }}</p>
        <p v-if="language === 'en'" class="text-sm text-gray-500 mt-2">
          These Terms of Service are published in Spanish. For questions, write to contact@boxly.mx.
        </p>

        <div class="mt-10 space-y-8 text-gray-700">
          <article v-for="clause in clauses" :key="clause.title">
            <h2 class="text-xl font-bold text-gray-900 mb-3">{{ clause.title }}</h2>
            <div class="space-y-3 leading-relaxed">
              <p v-for="(paragraph, i) in clause.paragraphs" :key="i">{{ paragraph }}</p>
            </div>
          </article>

          <section class="pt-6 border-t border-gray-100 text-sm text-gray-500">
            <p>
              Consulta también nuestro
              <NuxtLink to="/privacy-policy" class="text-primary-600 hover:underline">Aviso de Privacidad</NuxtLink>.
            </p>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Boxly Terms of Service — the final 2026 text (Boxly_Terminos_de_Servicio_FINAL_2026, version of
 * 13 October 2026), published verbatim. The date is the real publication date. New accounts accept this
 * version with the unchecked box on signup (users.terms_version, User::TERMS_VERSION in the API);
 * existing accounts see a discreet notice instead — the new text governs future contracting and does not
 * change orders already placed (clause 20).
 *
 * noindex: a utility page that used to compete with the commercial pages for brand queries; "follow" so
 * its links still count.
 */
useHead({
  title: 'Términos de Servicio - Boxly',
  meta: [{ name: 'robots', content: 'noindex, follow' }],
})

const { language } = useLanguage()
const TERMS_PUBLISHED = '13 de octubre de 2026'

const clauses = [
  {
    "title": "1. Identidad y alcance del servicio",
    "paragraphs": [
      "Boxly es una marca de servicios logísticos transfronterizos operada por Boxly USA LLC, sociedad constituida en California, Estados Unidos (en adelante, “Boxly”). Boxly presta, según la orden aceptada, servicios de recepción de compras en Estados Unidos, registro, almacenamiento temporal, consolidación, preparación y coordinación de traslado y entrega en México, así como compras asistidas y servicios complementarios expresamente contratados. La orden, la cotización confirmada y estos términos integran el acuerdo; las condiciones particulares confirmadas para una orden prevalecen en caso de contradicción. Boxly no es por ese solo hecho vendedor de compras realizadas directamente por el cliente, aseguradora, agente aduanal ni asesor fiscal. La contratación de proveedores especializados no elimina obligaciones legalmente exigibles a Boxly."
    ]
  },
  {
    "title": "2. Cuenta, aceptación e información del cliente",
    "paragraphs": [
      "El servicio se ofrece a mayores de 18 años con capacidad para contratar. El cliente deberá proporcionar datos de identificación, contacto, dirección de entrega, descripción, cantidad y valor real de la mercancía, así como comprobantes auténticos cuando se soliciten razonablemente. Es responsable de la seguridad de su cuenta y del uso correcto de su identificador. La dirección de recepción asignada no es domicilio personal, fiscal o comercial del cliente. La aceptación de las condiciones podrá acreditarse mediante registros electrónicos vinculados a la versión vigente, fecha y orden; la mera publicación no sustituye el consentimiento exigible. Boxly puede solicitar verificaciones justificadas de identidad, titularidad o legitimidad de la operación."
    ]
  },
  {
    "title": "3. Compra directa y compras asistidas",
    "paragraphs": [
      "En compras directas, el cliente compra y paga a la tienda; su relación de compraventa, garantías y devoluciones se rige por las condiciones del vendedor, sin perjuicio de la responsabilidad propia de Boxly por su manejo. Boxly no garantiza que el vendedor haya enviado todos los artículos ni su autenticidad, calidad, características o funcionamiento. En compras asistidas, Boxly identificará expresamente productos, costo de adquisición, comisión, moneda, costos logísticos y condiciones particulares; ninguna sustitución, compra adicional o cambio material de precio se ejecutará sin consentimiento del cliente."
    ]
  },
  {
    "title": "4. Recepción en San Diego y cadena de custodia",
    "paragraphs": [
      "El aviso “entregado” de una tienda o transportista no demuestra por sí solo la recepción física, integridad o contenido del paquete por Boxly. La recepción se documenta mediante los registros operativos disponibles, como escaneo, fecha, identificación y fotografías. Las imágenes acreditan únicamente el estado visible; la recepción ordinaria no incluye conteo pieza por pieza, autenticación ni pruebas técnicas, salvo acuerdo expreso. Ante discrepancias se revisarán guías, pruebas de entrega y registros. Cada transferencia de custodia se evaluará con evidencia; generar una guía nacional no equivale a entregar físicamente la caja al transportista."
    ]
  },
  {
    "title": "5. Consolidación, apertura y empaque",
    "paragraphs": [
      "Al contratar preparación o consolidación, el cliente autoriza abrir embalajes de transporte, examinar visualmente lo necesario, agrupar artículos y reorganizar o retirar empaques exteriores o de presentación para optimizar el espacio, preservando una protección razonable. Quien necesite conservar cajas originales, sellos, presentación de colección o accesorios de embalaje deberá solicitarlo antes de preparar la caja y obtener confirmación. Boxly observará cuidado razonable y responderá por daños o faltantes que legalmente le sean atribuibles; la autorización de reempaque no constituye autorización de dañar mercancía."
    ]
  },
  {
    "title": "6. Almacenamiento",
    "paragraphs": [
      "Cada paquete dispone de hasta 60 días naturales de almacenamiento ordinario desde su registro de recepción. El cliente deberá solicitar envío, devolución o extensión antes del vencimiento; cualquier extensión y tarifa adicional requieren comunicación y aceptación cuando proceda. Boxly podrá limitar nuevas recepciones ante falta de instrucciones, notificando al cliente. El vencimiento no supone abandono automático ni autoriza vender, donar, destruir o apropiarse de los bienes. Su disposición sólo podrá realizarse conforme al procedimiento legal aplicable; los retrasos causados por Boxly no se imputarán al cliente."
    ]
  },
  {
    "title": "7. Precios, alcance y pagos",
    "paragraphs": [
      "Las tarifas corresponden a la modalidad, volumen, peso, mercancía y destino aceptados. La cotización deberá identificar moneda, conceptos incluidos y cargos conocidos. Los servicios especiales, cajas adicionales o variaciones materiales de precio requerirán autorización previa cuando legalmente proceda. El pago deberá estar confirmado antes de la entrega al transporte nacional, salvo acuerdo distinto. Un enlace de pago, intento de cobro o guía creada no acreditan pago ni embarque. Los pagos duplicados o cobros improcedentes se corregirán conforme a la ley."
    ]
  },
  {
    "title": "8. Etapas, modalidades y tiempos",
    "paragraphs": [
      "El servicio comprende etapas distintas de recepción, preparación, traslado transfronterizo, formalidades aduaneras, preparación nacional y transporte final. Los plazos son estimados, salvo garantía expresamente contratada. El tránsito nacional comienza con la recepción física por la paquetería, no con la creación de guía. Boxly puede utilizar Paquetexpress para transporte terrestre y FedEx, Estafeta o DHL para servicios aéreos, según condiciones de la orden y disponibilidad. Inspecciones, restricciones oficiales, saturaciones, contingencias climáticas y hechos fuera de control razonable pueden afectar plazos, pero no eliminan automáticamente obligaciones de diligencia, información o responsabilidad propia. Un cambio relevante de modalidad, destino o precio se comunicará antes de proceder."
    ]
  },
  {
    "title": "9. Mercancías sujetas a restricciones",
    "paragraphs": [
      "Se rechazan mercancías ilícitas, falsificadas, armas, explosivos, efectivo y bienes cuyo manejo o importación esté prohibido. Perfumes, aerosoles, baterías, líquidos, alimentos, suplementos, medicamentos, dispositivos médicos y otros productos regulados requieren consulta y aprobación previa cuando corresponda. Recibir físicamente un paquete no implica que sea elegible para importación o transporte. Boxly podrá suspender razonablemente un envío si faltan datos, permisos o requisitos legales, comunicando el motivo y las alternativas. Se prohíben facturas alteradas y valores deliberadamente falsos."
    ]
  },
  {
    "title": "10. Aduanas, regímenes de importación y circulación nacional",
    "paragraphs": [
      "El ingreso de bienes a México y su circulación se sujetan al régimen aduanero efectivamente aplicable, contribuciones, regulaciones y restricciones no arancelarias. La coordinación del servicio puede involucrar importaciones consolidadas u otros procedimientos legalmente permitidos; el servicio ordinario no incluye un pedimento individual a nombre de cada cliente. La existencia de documentación consolidada no acredita, por sí sola, que cualquier mercancía pueda circular sin formalidades adicionales hacia todo el territorio nacional. Cuando el régimen de importación, el destino o las características del producto exijan reexpedición, pagos, permisos u otros actos, éstos deberán cumplirse antes del traslado correspondiente. Boxly no garantiza liberación sin inspección ni un resultado particular ante autoridades. La operación deberá contar con los soportes legalmente exigibles a quienes intervengan, sin trasladar contractualmente a los clientes las obligaciones propias de Boxly o de los sujetos legalmente responsables."
    ]
  },
  {
    "title": "11. Documentación de importación y trazabilidad",
    "paragraphs": [
      "Las facturas comerciales de tiendas, recibos de servicios logísticos, guías de transporte y documentos aduaneros son distintos y no se sustituyen entre sí. La mercancía podrá formar parte de una declaración o despacho consolidado sin que ello implique la emisión de un comprobante aduanero individualizado al destinatario. Boxly conservará o procurará, según sus responsabilidades y acceso legítimo, registros operativos que permitan relacionar las compras recibidas, la consolidación, la operación transfronteriza y la entrega nacional, y atenderá las solicitudes documentales que legalmente le correspondan. No se promete entregar pedimentos de terceros, información confidencial ajena ni documentos que la operación no genere. Cuando proceda una solicitud legítima, Boxly evaluará la documentación que pueda proporcionar conforme a la ley y a los derechos de terceros."
    ]
  },
  {
    "title": "12. Comprobantes comerciales y tratamiento fiscal",
    "paragraphs": [
      "Por servicios efectivamente contratados con Boxly USA LLC, se emitirá el comprobante comercial que corresponda conforme a la naturaleza de la operación y las obligaciones aplicables. Un invoice estadounidense no equivale por sí mismo a un CFDI mexicano ni a prueba de importación; tampoco determina automáticamente la deducibilidad o el acreditamiento de impuestos en México, que dependen de los requisitos legales y la situación del contribuyente. La moneda, plataforma de cobro o nombre del documento no determinan por sí solos la residencia fiscal, lugar de prestación, sujeto obligado ni tratamiento del IVA u otros impuestos. Boxly observará las obligaciones fiscales y documentales que le sean legalmente exigibles. El cliente que requiera documentación fiscal específica para su actividad deberá solicitar confirmación de disponibilidad antes de contratar, sin que ello implique renuncia a obligaciones fiscales irrenunciables."
    ]
  },
  {
    "title": "13. Reventa, inventarios y usos comerciales",
    "paragraphs": [
      "Los clientes que destinen productos a reventa o actividad empresarial deberán informar oportunamente requisitos particulares de importación, etiquetado, permisos, acreditación de propiedad y comprobación fiscal. El servicio ordinario no incluye representación aduanera individual, certificación de origen, inscripción en padrones, validación de NOM, preparación de expedientes fiscales para inventarios ni garantía de que un documento baste para deducciones, acreditamiento de IVA o reventa legal. Dichos servicios requieren evaluación y aceptación expresa, cuando sean posibles. Esta asignación no libera a Boxly de responsabilidades propias en la prestación contratada."
    ]
  },
  {
    "title": "14. Inspecciones y costos extraordinarios",
    "paragraphs": [
      "Las autoridades pueden revisar, retener, requerir información o imponer medidas sobre las mercancías. El cliente deberá cooperar con información auténtica y suficiente. Las contribuciones, multas o gastos extraordinarios no se atribuyen automáticamente al cliente por ser destinatario: su procedencia dependerá del sujeto obligado, la causa, el contrato y la legislación aplicable. Boxly sólo podrá reclamar costos reales, demostrables y legalmente repercutibles derivados directamente de información falsa o incumplimientos imputables al cliente, sin incluir errores propios o de quienes deba responder. No se añadirán cargos genéricos no previstos sin la información y autorización exigibles."
    ]
  },
  {
    "title": "15. Entrega nacional y seguimiento",
    "paragraphs": [
      "El cliente debe verificar destinatario, teléfono, domicilio y sucursal de recolección. Los costos derivados de datos incorrectos aportados por él se evaluarán conforme a su causa y prueba; Boxly corregirá sus propios errores sin transferir indebidamente su costo. La guía electrónica constituye un registro, no prueba de admisión física del transportista. Si el sistema indica “entregado” y el cliente lo desconoce, se revisarán pruebas de entrega y documentación disponible; dicho estado no cierra automáticamente la investigación. La participación de transportistas no exonera de manera general a Boxly de obligaciones propias."
    ]
  },
  {
    "title": "16. Daños, faltantes y reclamaciones",
    "paragraphs": [
      "El cliente deberá informar incidencias tan pronto como sea razonable, indicando orden, guía, bienes afectados y evidencia disponible (fotografías, empaques, etiquetas, recibos). Se recomienda informar daños o faltantes en los primeros 5 días naturales posteriores a la recepción para facilitar la investigación; este plazo operativo no reduce periodos legales ni extingue derechos. El video de apertura puede apoyar, pero no es requisito único y excluyente. Boxly revisará registros de recepción, consolidación, pesos, traslado y entrega según disponibilidad y comunicará una resolución motivada. Ni la presentación de la queja acredita automáticamente la pérdida ni la ausencia de una pieza de evidencia implica rechazo automático."
    ]
  },
  {
    "title": "17. Protección opcional y responsabilidad",
    "paragraphs": [
      "El servicio no incluye automáticamente una póliza de seguro. Cuando esté disponible y se contrate expresamente para una caja, Boxly Protection es un beneficio comercial opcional de hasta $10,000 MXN por caja protegida, sin exceder el valor de compra documentado de los bienes efectivamente afectados, bajo las condiciones comunicadas y aceptadas para esa orden. No es una póliza emitida por una aseguradora ni un límite general de responsabilidad civil. Actualmente los envíos terrestres no incluyen Boxly Protection. La protección no comprende defectos de origen, bienes no enviados por el vendedor ni ganancias comerciales esperadas; las exclusiones requieren revisión causal y no eliminan responsabilidades legales propias de Boxly. Se evitará doble recuperación por el mismo daño."
    ]
  },
  {
    "title": "18. Cancelaciones y devoluciones",
    "paragraphs": [
      "Las cancelaciones se solicitan por canales oficiales y se analizan según los servicios ejecutados, costos de terceros acreditados y derechos aplicables. La creación de una guía no convierte automáticamente en no reembolsable la totalidad de un servicio. Tras la entrega física al transportista, interceptaciones y retornos dependen de disponibilidad y condiciones correspondientes. Los reembolsos procedentes se efectuarán preferentemente por el medio de pago original cuando sea viable; no serán sustituidos unilateralmente por saldo interno."
    ]
  },
  {
    "title": "19. Contracargos, saldos y suspensión",
    "paragraphs": [
      "Ante pago rechazado, reversión, saldo vencido o contracargo, Boxly podrá revisar la transacción y suspender razonablemente servicios pendientes directamente relacionados con el importe controvertido, así como limitar nuevas contrataciones cuando exista causa objetiva, notificando medios de aclaración. Un contracargo no constituye automáticamente fraude ni extingue por sí solo una obligación efectivamente contraída. Se conciliarán recuperaciones para evitar doble cobro. Ninguna controversia confiere automáticamente facultad para retener indefinidamente, vender o disponer de mercancía del cliente; su custodia, entrega o devolución estará sujeta a la ley, los derechos del titular y las obligaciones previamente asumidas."
    ]
  },
  {
    "title": "20. Uso responsable, modificaciones y derechos",
    "paragraphs": [
      "Boxly podrá suspender razonablemente nuevos servicios por riesgos de seguridad, ilícitos, documentación falsa, mercancía prohibida o incumplimientos materiales, manteniendo obligaciones respecto de bienes ya recibidos. Podrá emplear asistentes automatizados para consultas y notificaciones; una respuesta automática general no sustituye las condiciones particulares aceptadas de una orden. Los datos personales se rigen por el Aviso de Privacidad publicado en boxly.mx. Las actualizaciones de estos términos regirán las futuras contrataciones y no cambiarán unilateralmente órdenes anteriores. La invalidez de una disposición no afecta las restantes. Las controversias se atenderán por los canales oficiales, sin limitar recursos bancarios, administrativos o judiciales irrenunciables; la ley y jurisdicción se determinarán según las normas aplicables a la operación. Contacto: contact@boxly.mx | WhatsApp +1 (619) 559-1910 | boxly.mx."
    ]
  }
]
</script>
