<template>
  <div class="p-6 max-w-6xl mx-auto">
    <h1 class="text-xl font-bold text-gray-900">Variant picker lab</h1>
    <p class="text-sm text-gray-500 mt-1">One fixture per variant shape the stores throw at us. The card is the exact component the chat renders; picks show below each card.</p>
    <div class="mt-6 grid gap-6 md:grid-cols-2">
      <div v-for="f in fixtures" :key="f.name">
        <p class="text-[12px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{{ f.name }}</p>
        <VariantPicker :data="f.data" @pick="(t) => (picks[f.name] = t)" />
        <p v-if="picks[f.name]" class="mt-2 text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">→ {{ picks[f.name] }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
const now = new Date().toISOString()
const picks = reactive({})
const NB = 'https://www.newbalance.com/pd/9060/U9060V1_LI-FTW-825955-PMG-NA.html'
const grid = (axes, mk) => { const out = []; const rec = (i, acc) => { if (i === axes.length) { out.push(mk(acc)); return } for (const v of axes[i].values) rec(i + 1, { ...acc, [axes[i].name]: v }) }; rec(0, {}); return out }
const fixtures = [
  { name: 'Shoes · colour × size (New Balance 9060, SFCC)', data: { product: { title: 'New Balance 9060', store: 'New Balance', price: 159.99, image: 'https://nb.scene7.com/is/image/NB/u9060eeg_nb_02_i?$pdpflexf2$', url: NB }, source: 'live', checked_at: now,
    axes: [{ name: 'Color', kind: 'color', values: ['Sea Salt', 'Black', 'Rain Cloud'] }, { name: 'Size', kind: 'size', values: ['M4 / W5.5', 'M5 / W6.5', 'M6 / W7.5', 'M7 / W8.5', 'M8 / W9.5', 'M9 / W10.5', 'M10 / W11.5', 'M11 / W12.5', 'M12 / W13.5', 'M13'] }],
    variants: grid([{ name: 'Color', values: ['Sea Salt', 'Black', 'Rain Cloud'] }, { name: 'Size', values: ['M4 / W5.5', 'M5 / W6.5', 'M6 / W7.5', 'M7 / W8.5', 'M8 / W9.5', 'M9 / W10.5', 'M10 / W11.5', 'M11 / W12.5', 'M12 / W13.5', 'M13'] }], (o) => ({ key: `${o.Color} / ${o.Size}`, options: o, available: !(o.Color === 'Black' && /M(4|5|13)/.test(o.Size)) && !(o.Color === 'Rain Cloud' && /M(6|7|8)/.test(o.Size)), price: o.Color === 'Sea Salt' ? 159.99 : 149.99, list_price: o.Color === 'Black' ? 159.99 : null, low_stock: o.Size === 'M9 / W10.5' ? 'Only 2 left' : null })) } },
  { name: 'Shoes · per-AXIS rows, colour pre-selected from the URL (New Balance 9060 as the reader returns it)', data: { product: { title: 'New Balance 9060', store: 'New Balance', price: 159.99, image: 'https://nb.scene7.com/is/image/NB/u9060eeg_nb_02_i?$pdpflexf2$', url: NB }, source: 'live', checked_at: now, axes_independent: true, selected: { Color: 'BREAKFAST TEA with ANGORA' },
    axes: [{ name: 'Color', kind: 'color', values: ['BREAKFAST TEA with ANGORA', 'Sea Salt', 'Black', 'Rain Cloud'] }, { name: 'Size', kind: 'size', values: ['M4 / W5.5 (4)', 'M4.5 / W6 (4.5)', 'M5 / W6.5 (5)', 'M6 / W7.5 (6)', 'M7 / W8.5 (7)', 'M8 / W9.5 (8)', 'M9 / W10.5 (9)', 'M10 / W11.5 (10)', 'M11 / W12.5 (11)', 'M12 / W13.5 (12)', 'M13 / W14.5 (13)'] }],
    variants: [
      ...['BREAKFAST TEA with ANGORA', 'Sea Salt', 'Black', 'Rain Cloud'].map((c) => ({ key: 'Color:' + c, options: { Color: c }, available: true, price: 159.99 })),
      ...['M4 / W5.5 (4)', 'M4.5 / W6 (4.5)', 'M5 / W6.5 (5)', 'M6 / W7.5 (6)', 'M7 / W8.5 (7)', 'M8 / W9.5 (8)', 'M9 / W10.5 (9)', 'M10 / W11.5 (10)', 'M11 / W12.5 (11)', 'M12 / W13.5 (12)', 'M13 / W14.5 (13)'].map((sz) => ({ key: 'Size:' + sz, options: { Size: sz }, available: /\(4\)|\(9\)|\(10\)|\(11\)|\(12\)/.test(sz), price: 159.99 })),
    ] } },
  { name: 'Jeans · waist × length × wash (Old Navy)', data: { product: { title: 'Straight Built-In Flex Jeans', store: 'Old Navy', price: 29.99, list_price: 44.99, url: 'https://oldnavy.gap.com/browse/product.do?pid=1' }, source: 'live', checked_at: new Date(Date.now() - 4 * 60000).toISOString(),
    axes: [{ name: 'Wash', kind: 'color', values: ['Dark Wash', 'Medium Wash', 'Black'] }, { name: 'Waist', kind: 'size', values: ['28', '29', '30', '31', '32', '33', '34', '36', '38', '40'] }, { name: 'Length', kind: 'length', values: ['30', '32', '34'] }],
    variants: grid([{ name: 'Wash', values: ['Dark Wash', 'Medium Wash', 'Black'] }, { name: 'Waist', values: ['28', '29', '30', '31', '32', '33', '34', '36', '38', '40'] }, { name: 'Length', values: ['30', '32', '34'] }], (o) => ({ key: `${o.Wash} ${o.Waist}x${o.Length}`, options: o, available: !(o.Length === '34' && Number(o.Waist) < 32) && !(o.Wash === 'Black' && o.Waist === '30'), price: 29.99, list_price: 44.99 })) } },
  { name: 'Apparel · size only (Alo legging)', data: { product: { title: 'High-Waist Airlift Legging - Black', store: 'Alo Yoga', price: 128, url: 'https://www.aloyoga.com/products/w5473r' }, source: 'catalog', checked_at: new Date(Date.now() - 50 * 60000).toISOString(),
    axes: [{ name: 'Size', kind: 'size', values: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'] }],
    variants: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => ({ key: s, options: { Size: s }, size: s, available: !['XXS', 'XL'].includes(s), price: 128 })) } },
  { name: 'Drinkware · capacity × colour (Stanley Quencher)', data: { product: { title: 'Quencher H2.0 FlowState Tumbler', store: 'Stanley', url: 'https://www.stanley1913.com/products/adventure-quencher' }, source: 'live', checked_at: now,
    axes: [{ name: 'Capacity', kind: 'capacity', values: ['20 oz', '30 oz', '40 oz'] }, { name: 'Color', kind: 'color', values: ['Cream', 'Rose Quartz', 'Navy', 'Charcoal'] }],
    variants: grid([{ name: 'Capacity', values: ['20 oz', '30 oz', '40 oz'] }, { name: 'Color', values: ['Cream', 'Rose Quartz', 'Navy', 'Charcoal'] }], (o) => ({ key: `${o.Capacity} ${o.Color}`, options: o, available: !(o.Capacity === '40 oz' && o.Color === 'Rose Quartz'), price: o.Capacity === '20 oz' ? 30 : o.Capacity === '30 oz' ? 35 : 45 })) } },
  { name: 'Beauty · scent only (Bath & Body Works mist)', data: { product: { title: 'Fine Fragrance Mist', store: 'Bath & Body Works', price: 8.95, list_price: 17.95, url: 'https://www.bathandbodyworks.com/p/mist' }, source: 'live', checked_at: now,
    axes: [{ name: 'Scent', kind: 'scent', values: ['Japanese Cherry Blossom', 'A Thousand Wishes', 'Warm Vanilla Sugar', 'Champagne Toast', 'Gingham'] }],
    variants: ['Japanese Cherry Blossom', 'A Thousand Wishes', 'Warm Vanilla Sugar', 'Champagne Toast', 'Gingham'].map((s) => ({ key: s, options: { Scent: s }, available: s !== 'Champagne Toast', price: 8.95, list_price: 17.95 })) } },
  { name: 'Multipack · pack count × colour (socks)', data: { product: { title: 'Everyday Cushion Crew Socks', store: 'Walmart', url: 'https://www.walmart.com/ip/1' }, source: 'live', checked_at: now,
    axes: [{ name: 'Count', kind: 'pack', values: ['3-Pack', '6-Pack', '12-Pack'] }, { name: 'Color', kind: 'color', values: ['White', 'Black'] }],
    variants: grid([{ name: 'Count', values: ['3-Pack', '6-Pack', '12-Pack'] }, { name: 'Color', values: ['White', 'Black'] }], (o) => ({ key: `${o.Count} ${o.Color}`, options: o, available: !(o.Count === '12-Pack' && o.Color === 'Black'), price: o.Count === '3-Pack' ? 6.98 : o.Count === '6-Pack' ? 11.98 : 19.98 })) } },
  { name: 'Legacy read · size/colour fields only (no axes)', data: { product: { title: 'Pegasus 41', store: 'Nike', price: 140 }, source: 'live', checked_at: now,
    variants: [{ key: 'Black / 9', size: '9', color: 'Black', available: true, price: 140 }, { key: 'Black / 10', size: '10', color: 'Black', available: false, price: 140 }, { key: 'White / 9', size: '9', color: 'White', available: true, price: 140 }, { key: 'White / 10', size: '10', color: 'White', available: true, price: 125, list_price: 140 }] } },
  { name: 'Single SKU · no variants (LEGO set)', data: { product: { title: 'LEGO Icons Bonsai Tree 10281', store: 'LEGO', price: 49.99 }, source: 'live', checked_at: now, axes: [], variants: [{ key: 'default', options: {}, available: true, price: 49.99 }] } },
]
</script>
