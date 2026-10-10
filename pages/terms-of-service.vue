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

        <div class="mt-10 space-y-12 text-gray-700">
          <section v-for="part in parts" :key="part.title">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">{{ part.title }}</h2>
            <div class="space-y-8">
              <article v-for="clause in part.clauses" :key="clause.title">
                <h3 class="text-lg font-semibold text-gray-900 mb-3">{{ clause.title }}</h3>
                <div class="space-y-3 leading-relaxed">
                  <p v-for="(paragraph, i) in clause.paragraphs" :key="i">{{ paragraph }}</p>
                </div>
              </article>
            </div>
          </section>

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
 * Boxly Terms of Service — the agreement from the 2026-10-10 legal update ("Actualización
 * contractual", edición 3, pages 2–6), published verbatim. The date is the real publication date
 * (it used to print today's date on every visit). New accounts accept this version with the unchecked
 * box on signup (users.terms_version = 2026-10-10, User::TERMS_VERSION in the API); existing accounts
 * see a discreet notice instead — the new text does not apply retroactively to orders already contracted.
 *
 * noindex: a utility page that used to compete with the commercial pages for brand queries; "follow" so
 * its links still count.
 */
useHead({
  title: 'Términos de Servicio - Boxly',
  meta: [{ name: 'robots', content: 'noindex, follow' }],
})

const { language } = useLanguage()
const TERMS_PUBLISHED = '10 de octubre de 2026'

const parts = [
  {
    "title": "1. Alcance y manejo de compras",
    "clauses": [
      {
        "title": "1. Servicio y cuenta",
        "paragraphs": [
          "Boxly es un servicio operado mediante una LLC en Estados Unidos. Ofrece recepción, almacenamiento temporal, consolidación y coordinación logística de compras desde Estados Unidos hacia México. El servicio contratado se integra por la orden, su cotización aceptada y estos términos. Las condiciones particulares expresamente confirmadas para una orden se conservan. El servicio está dirigido a mayores de 18 años.",
          "Debes proporcionar datos correctos, utilizar el identificador asignado a tu cuenta y mantener tus credenciales seguras. Si detectas actividad no autorizada, notifícanos. La dirección de recepción se utiliza para compras gestionadas mediante Boxly y no constituye un domicilio residencial ni una dirección para trámites personales."
        ]
      },
      {
        "title": "2. Información de las compras",
        "paragraphs": [
          "El cliente debe proporcionar descripción, cantidad, valor real de compra y comprobantes auténticos de la mercancía, así como informar restricciones o necesidades de manejo. Boxly podrá suspender la preparación hasta recibir información necesaria y verificable. Los costos adicionales efectivamente causados por datos falsos o instrucciones incorrectas del cliente deberán acreditarse y ser legalmente procedentes; no se trasladarán errores propios de Boxly. No se aceptan declaraciones falsas ni alteraciones de comprobantes."
        ]
      },
      {
        "title": "3. Recepción en San Diego",
        "paragraphs": [
          "Los paquetes se vinculan a tu cuenta mediante sus datos de identificación y registros de recepción. Si la tienda o el transportista reporta una entrega que no aparece en tu cuenta, envíanos la guía y el comprobante para revisarla. El estado “entregado” del proveedor no acredita por sí solo la cantidad, integridad o contenido de la compra.",
          "La recepción ordinaria no incluye inventario pieza por pieza, prueba de funcionamiento, autenticidad ni verificación detallada de tallas, modelos o accesorios. Las fotografías de recepción documentan el estado visible del paquete, no la totalidad de su contenido. Cualquier revisión específica requiere solicitud y confirmación previa de su alcance y costo, si corresponde."
        ]
      },
      {
        "title": "4. Consolidación y empaque",
        "paragraphs": [
          "Al solicitar consolidación, autorizas la apertura de los paquetes y su agrupación o reempaque para preparar el envío. Pueden retirarse cajas exteriores y empaques de presentación para aprovechar el espacio, conservando las protecciones necesarias para el manejo acordado. Si necesitas conservar una caja original o presentación específica, indícalo antes de consolidar y espera nuestra confirmación.",
          "Boxly debe manejar los bienes con cuidado razonable. Los daños previos, defectos de origen o empaques insuficientes del vendedor se revisarán con evidencia para determinar su relación con el incidente. No se atribuirán automáticamente a Boxly faltantes que el vendedor nunca haya enviado, ni se excluirán daños ocasionados por el propio manejo de Boxly."
        ]
      }
    ]
  },
  {
    "title": "2. Tarifas, almacenamiento y transporte",
    "clauses": [
      {
        "title": "5. Almacenamiento",
        "paragraphs": [
          "El plazo ordinario de almacenamiento es de 60 días naturales desde el registro de recepción de cada paquete. Solicita tus instrucciones de envío, devolución o extensión antes de su vencimiento. Una extensión está sujeta a disponibilidad y a las condiciones informadas y aceptadas previamente.",
          "Si no recibimos instrucciones, podremos pausar nuevos servicios y contactarte para resolver el almacenamiento de tus bienes. El vencimiento no autoriza automáticamente su venta, donación o destrucción. No se cobrarán tarifas adicionales no informadas ni se considerarán abandono los retrasos atribuibles a Boxly."
        ]
      },
      {
        "title": "6. Tarifas y pago",
        "paragraphs": [
          "La tarifa por caja aplica dentro de los límites publicados de volumen, peso, mercancía y destino. La cotización debe identificar moneda, importe total, conceptos incluidos y servicios adicionales. La modalidad y sus inclusiones no se deducen de una promoción de otro servicio. Cualquier caja adicional, manejo especial o costo fuera de la cotización requiere información y autorización previa. Un incremento de costo del proveedor no modifica por sí solo el precio confirmado al cliente.",
          "El pago del servicio de envío debe quedar confirmado antes de entregar la caja para su transporte nacional. En compras asistidas, el producto y la comisión se pagan conforme a la cotización aceptada. La generación de una guía no acredita pago ni entrega física a la paquetería. Un cargo adicional no se considera autorizado únicamente por el silencio del cliente."
        ]
      },
      {
        "title": "7. Etapas y tiempos estimados",
        "paragraphs": [
          "La operación comprende recepción y preparación en Estados Unidos, traslado y proceso aduanero, entrega a la paquetería y transporte nacional. Los tiempos de cada etapa son estimaciones y no una garantía de fecha exacta, salvo compromiso expreso aplicable a tu orden.",
          "La estimación de tránsito nacional comienza cuando el transportista recibe físicamente la caja, no cuando se genera la guía ni cuando la tienda entrega la compra en San Diego. Inspecciones, restricciones de autoridad, saturación, clima u otras circunstancias fuera del control razonable de Boxly pueden afectar los plazos. Boxly dará seguimiento y comunicará cambios relevantes; la existencia de un retraso no elimina sus obligaciones propias."
        ]
      },
      {
        "title": "8. Modalidad y requisitos de envío",
        "paragraphs": [
          "Para envíos terrestres, Boxly utiliza Paquetexpress. Para envíos aéreos, utiliza FedEx, Estafeta y DHL según disponibilidad, destino y servicio contratado. La orden identifica la modalidad y el servicio concreto; no se garantiza que todos los trayectos se realicen por un único medio. Una modificación relevante de modalidad, destino o precio se informa antes de proceder. Si el cliente no la acepta, se revisan alternativas o cancelación conforme a las etapas efectivamente realizadas.",
          "Las estimaciones ordinarias publicadas no aplican como garantía a una operación con incidencias notificadas. La falta de movimientos en rastreo requiere verificar la etapa real; no acredita por sí sola pérdida definitiva. La fuerza mayor se evalúa por su causa y efecto concreto, no como una exclusión automática para cualquier demora."
        ]
      }
    ]
  },
  {
    "title": "3. Documentación y condiciones fiscales",
    "clauses": [
      {
        "title": "9. Comprobantes del servicio",
        "paragraphs": [
          "Para los servicios contratados con la LLC estadounidense, Boxly proporciona el comprobante comercial correspondiente a esa operación. Un recibo o invoice comercial estadounidense no equivale a un CFDI mexicano ni acredita por sí solo deducibilidad o acreditamiento de impuestos en México. Si el cliente requiere un documento fiscal específico, debe consultar su disponibilidad antes de contratar. Se respetan las obligaciones de emisión que resulten aplicables a la operación.",
          "El precio final y el tratamiento de cargos e impuestos se informan en la cotización. La denominación del comprobante o la moneda del pago no modifican por sí solas la naturaleza de la operación. No se añadirán contribuciones no incluidas en la cotización bajo conceptos genéricos ni se prometerán beneficios fiscales al cliente."
        ]
      },
      {
        "title": "10. Compras directas y asistidas",
        "paragraphs": [
          "En compras directas, el cliente compra y paga a la tienda; el comprobante del producto y los derechos frente al vendedor corresponden a esa compra. El pago a Boxly ampara el servicio contratado, no una venta automática de los artículos recibidos. En compras asistidas, la cotización identifica producto, importe de compra, comisión, moneda y servicios logísticos. Cambios de precio, sustituciones o compras adicionales requieren autorización. Las políticas de devolución de la tienda no sustituyen las obligaciones propias del servicio de Boxly."
        ]
      },
      {
        "title": "11. Aduanas y documentación específica",
        "paragraphs": [
          "Boxly coordina las etapas logísticas y de despacho que correspondan al servicio; no se presenta como agente aduanal ni promete un pedimento individual a nombre del cliente como prestación ordinaria. Los requisitos y documentos disponibles dependen del producto y de la operación. Si el cliente necesita soporte específico para reventa, permisos o documentación a su nombre, debe consultarlo antes de enviar la compra y obtener confirmación expresa de que puede atenderse.",
          "El comprobante del servicio, la factura de la tienda y la guía de transporte cumplen funciones distintas; no se ofrecen como documentos intercambiables ni como sustitutos automáticos del soporte de importación que corresponda. Boxly podrá detener la preparación cuando falte información necesaria o no se pueda atender legalmente el servicio, explicando el motivo y las opciones procedentes."
        ]
      },
      {
        "title": "12. Inspecciones, restricciones y uso posterior",
        "paragraphs": [
          "Las autoridades pueden revisar mercancía, solicitar información o aplicar medidas que afecten el proceso. No se garantiza liberación sin inspección ni un resultado aduanero específico. El cliente debe cooperar aportando información auténtica. Los costos que resulten legalmente a su cargo se comunicarán y documentarán; no se presume que sea el único responsable de toda contribución o incidencia por ser destinatario.",
          "Boxly no garantiza que una compra sea apta para reventa o que satisfaga requisitos particulares de etiquetado, permisos o actividad comercial no incluidos expresamente en el servicio. El cliente es responsable de su uso posterior y de las obligaciones propias de su actividad. Esto no releva a Boxly de las obligaciones que correspondan al servicio efectivamente contratado."
        ]
      }
    ]
  },
  {
    "title": "4. Custodia, entrega y reclamaciones",
    "clauses": [
      {
        "title": "13. Custodia y entrega",
        "paragraphs": [
          "La custodia de cada etapa se acredita con registros de recepción, preparación y entrega física, recibos, fotografías y demás evidencia disponible. Crear una guía no transfiere custodia. Al recibir la caja, el proveedor correspondiente asume las funciones de manejo y transporte de esa etapa bajo las condiciones de su servicio. Boxly dará seguimiento y atenderá sus obligaciones propias; contratar a un tercero no equivale a exoneración general.",
          "Debes verificar nombre, teléfono, domicilio o sucursal de entrega antes de confirmar. Los costos reales generados por un error del cliente se informarán y documentarán. Los errores atribuibles a Boxly se gestionarán sin trasladar al cliente el costo propio de su corrección.",
          "Si el rastreo indica “entregado” y no recibiste, avísanos para revisar la prueba de entrega, dirección y destinatario. El estado de rastreo no cierra automáticamente una reclamación de no recepción."
        ]
      },
      {
        "title": "14. Reclamación y evaluación de evidencia",
        "paragraphs": [
          "Reporta la incidencia lo antes posible por los canales de contacto de Boxly. Incluye número de orden y guía, descripción específica del problema, comprobantes de compra y fotografías disponibles de la caja, etiquetas, sellos, empaque y artículos afectados. Conserva el empaque mientras se investiga. Un video de apertura puede ayudar, pero su ausencia no descarta automáticamente el reclamo.",
          "Recomendamos reportar daños o faltantes dentro de los primeros 5 días naturales posteriores a la recepción para facilitar la investigación. Este plazo de aviso no extingue por sí solo tus derechos legales. En casos de no recepción, reporta cuando detectes la anomalía; una fecha estimada incumplida no inicia un plazo fatal de reclamación.",
          "Presentar un reclamo no acredita por sí solo el incidente ni genera un reembolso automático. Boxly contrastará la relación de artículos, comprobantes, fotografías, registros de preparación, pesos disponibles, sellos y entrega. Si falta documentación relevante, solicitará información adicional o alternativas razonables. El cliente debe colaborar y conservar evidencia auténtica. Boxly comunicará una decisión motivada sobre la procedencia e importe reclamado; no determinará responsabilidad por una sola presunción."
        ]
      },
      {
        "title": "15. Protección opcional por caja",
        "paragraphs": [
          "El servicio no incluye una póliza de seguro por defecto. Si existe una protección opcional para tu modalidad, su contratación debe constar expresamente para la caja correspondiente. Aplican el alcance y las condiciones informados antes de pagar; no se presume cobertura para otras cajas, modalidades o periodos.",
          "Cuando Boxly Protection haya sido contratada, su beneficio comercial es de hasta $10,000 MXN por caja protegida, sin superar el valor de compra documentado de los artículos afectados, sujeto a las condiciones de esa contratación. Este beneficio no equivale a una póliza de aseguradora ni constituye un límite general de todas las responsabilidades de Boxly.",
          "La protección no cubre ganancias esperadas, diferencias de precio para reposición ni pérdidas comerciales por demora. No se consideran incidentes cubiertos los defectos de fábrica, daños preexistentes o artículos no enviados por el vendedor. La relación causal de cualquier exclusión debe revisarse; no elimina responsabilidades propias de Boxly. Una declaración de valor no contrata protección por sí sola. No se pagará dos veces el mismo daño: se concilian recuperaciones del vendedor, transportista o protección respecto de los mismos bienes. Las órdenes ya protegidas conservan las condiciones contratadas."
        ]
      }
    ]
  },
  {
    "title": "5. Cancelaciones, cobro y cierre",
    "clauses": [
      {
        "title": "16. Cancelaciones y reembolsos",
        "paragraphs": [
          "La cancelación debe solicitarse cuanto antes. Se revisarán los servicios realizados y cargos recuperables de terceros; generar una guía no vuelve automáticamente no reembolsable todo el pago. Los importes retenidos deben ser procedentes, informados y documentados. Después de entregar al transportista, la interceptación o devolución depende de viabilidad y costos. Los reembolsos procedentes se tramitan al medio original cuando sea posible, confirmando importe y fecha de trámite; no se sustituyen por saldo interno sin consentimiento."
        ]
      },
      {
        "title": "17. Saldos pendientes y contracargos",
        "paragraphs": [
          "El pago debe estar efectivamente confirmado, no únicamente intentado. Ante rechazo, reversión o contracargo, Boxly podrá suspender la preparación o despacho pendiente relacionado con el saldo afectado y limitar nuevas contrataciones mientras aclara la operación. Comunicará el importe, motivo e información necesaria para resolverlo. El cliente debe aportar comprobantes auténticos; una devolución bancaria no acredita por sí sola que el servicio no se prestó ni resuelve definitivamente la obligación subyacente. Se conciliarán recuperaciones para evitar cobro duplicado.",
          "Una disputa no se considera fraude por sí sola. El ejercicio de derechos de reclamación no autoriza a disponer de tus bienes. Mantendremos un canal para aclarar el saldo y acordar la entrega o devolución que corresponda, respetando las obligaciones ya asumidas y los derechos aplicables."
        ]
      },
      {
        "title": "18. Mercancía no admitida y costos atribuibles",
        "paragraphs": [
          "No aceptamos mercancía ilegal, armas, explosivos, dinero en efectivo, falsificaciones ni productos cuyo manejo esté prohibido. Perfumes, líquidos, baterías, alimentos, suplementos y otras categorías con restricciones requieren consulta previa. Boxly podrá detener un servicio que no pueda realizarse legalmente e informar las opciones procedentes. Cuando información falsa o un envío no autorizado del cliente cause gastos o reclamaciones de terceros, Boxly podrá reclamar los importes acreditados y legalmente procedentes atribuibles a ese incumplimiento. No incluye errores propios de Boxly. La disposición de bienes requiere fundamento legal; no se realizará automáticamente por una política de rechazo."
        ]
      },
      {
        "title": "19. Responsabilidad, suspensión y actualización",
        "paragraphs": [
          "La responsabilidad por un incidente depende de sus causas, la etapa y las obligaciones de las partes. No se prometen compensaciones por ventas esperadas, ganancias no obtenidas u otras consecuencias comerciales indirectas, salvo obligación legal o compromiso expreso. Ninguna disposición excluye responsabilidades que legalmente no puedan limitarse.",
          "Podremos limitar nuevos servicios por incumplimiento material, riesgo de seguridad, uso ilícito o pagos pendientes, informando el motivo cuando corresponda. La suspensión no elimina reclamos abiertos ni obligaciones sobre mercancía recibida. Los cambios relevantes de términos se comunicarán para contrataciones futuras, sin alterar retroactivamente órdenes anteriores. Mantener los términos publicados no acredita por sí solo aceptación expresa del cliente."
        ]
      },
      {
        "title": "20. Comunicación y derechos",
        "paragraphs": [
          "Contacto: WhatsApp +1 (619) 559-1910 y contact@boxly.mx. La solución directa no impide acudir al banco, autoridades o tribunales competentes. La legislación y competencia se determinan conforme a la operación, sin renuncia a derechos obligatorios. Una cláusula inválida no afecta las demás válidas. Las respuestas automatizadas no modifican por sí solas una orden; Boxly revisará discrepancias con sus condiciones confirmadas. El Aviso de Privacidad se consulta por separado."
        ]
      }
    ]
  }
]
</script>
