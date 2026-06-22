/**
 * FALLBACK knowledge base for the AI assistant — used ONLY if the admin-managed
 * wiki (GET /knowledge on the API) can't be reached. The real, editable source of
 * truth lives in the database and is curated by the team in the admin
 * "Base de conocimiento" page. Keep this minimal but correct.
 */
export const FALLBACK_KNOWLEDGE = `# General

## ¿Qué es Boxly?
Boxly te ayuda a comprar productos de tiendas de Estados Unidos y recibirlos en México, aunque la tienda no envíe a México y aunque no tengas tarjeta de EE. UU. Tú eliges el producto (o mandas el link), Boxly lo compra por ti, lo importa y te lo entrega en México.

## ¿Cómo funciona?
1. Encuentras el producto o mandas el link. 2. Creas una solicitud (no pagas nada todavía). 3. Boxly te manda una cotización con el total. 4. Apruebas y pagas. 5. Boxly compra, importa y te entrega en México.

# Precios

## Precios y comisiones
El precio de la tienda NO es el precio final. Tu total = precio del producto + comisión de Boxly (10%) + envío internacional + impuestos cuando aplican (IVA 16% sobre el valor declarado de $50 USD o más). Pagas solo cuando apruebas la cotización.

# Pagos

## Métodos de pago
Pagas en México, en pesos, y solo después de aprobar tu cotización. No necesitas tarjeta de EE. UU. ni VPN.`
