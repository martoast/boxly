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

## Precios y comisiones (hay DOS casos)
La comisión de 10% NO se cobra siempre — depende de quién compra los productos:

1. **Compra asistida (Boxly compra por ti):** para clientes que no tienen una tarjeta aceptada en tiendas de EE. UU. Boxly compra el producto por ti. Pagas: precio del producto + **10% de comisión de Boxly** + precio de la caja (envío) + impuestos cuando aplican (IVA 16% sobre el valor declarado de $50 USD o más). **El 10% se calcula sobre el TOTAL FINAL de la compra al hacer checkout (producto + el envío que cobre la tienda hasta nuestra bodega en San Diego + impuestos que cobre la tienda), NO solo sobre el precio de lista que se muestra.** El 10% SOLO aplica en este caso.

2. **Casillero / envío propio (tú compras, Boxly solo envía):** si compras tus propios productos con tu tarjeta y los mandas a tu dirección Boxly en EE. UU., Boxly solo los consolida y los envía. Pagas **solo el precio de la caja (envío fijo)** — SIN comisión del 10%.

En ambos casos pagas solo cuando apruebas tu cotización.

# Pagos

## Métodos de pago
Pagas en México, en pesos, y solo después de aprobar tu cotización. No necesitas tarjeta de EE. UU. ni VPN.`
