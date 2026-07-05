// composables/useExpenseCategories.js
// Single source of truth for expense SCOPE + category labels/cards.
// Business = company costs (feed dashboard profit). Personal = the owners'
// own money (rent/food/misc), tracked separately, never in business profit.
// (Business subcategories still live in the modal/index — this only owns the
// top-level category + scope layer that the scope feature needs.)
export const useExpenseCategories = () => {
  const { t: createTranslations } = useLanguage()

  const SCOPE_BUSINESS = 'business'
  const SCOPE_PERSONAL = 'personal'

  const BUSINESS_CATEGORIES = ['shipping', 'ads', 'software', 'office', 'po_box', 'misc']
  const PERSONAL_CATEGORIES = ['rent', 'food', 'misc']

  const labels = createTranslations({
    // business
    shipping: { es: 'Envíos', en: 'Shipping' },
    ads: { es: 'Publicidad', en: 'Advertising' },
    software: { es: 'Software', en: 'Software' },
    office: { es: 'Oficina', en: 'Office' },
    po_box: { es: 'PO Box', en: 'PO Box' },
    misc: { es: 'Varios', en: 'Miscellaneous' },
    // personal
    rent: { es: 'Renta', en: 'Rent' },
    food: { es: 'Comida', en: 'Food' },
    // scope tab labels
    scope_business: { es: 'Negocio', en: 'Business' },
    scope_personal: { es: 'Personal', en: 'Personal' },
    scope_all: { es: 'Todos', en: 'All' },
  })

  // Card visual metadata (icon path + colors) per category.
  const META = {
    shipping: { icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0', bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
    ads: { icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
    software: { icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', bgColor: 'bg-green-50', iconColor: 'text-green-600' },
    office: { icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', bgColor: 'bg-amber-50', iconColor: 'text-amber-600' },
    po_box: { icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', bgColor: 'bg-teal-50', iconColor: 'text-teal-600' },
    misc: { icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4', bgColor: 'bg-gray-50', iconColor: 'text-gray-600' },
    // personal
    rent: { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', bgColor: 'bg-rose-50', iconColor: 'text-rose-600' },
    food: { icon: 'M3 3h18v18H3zM3 9h18M9 9v12', bgColor: 'bg-orange-50', iconColor: 'text-orange-600' },
  }

  const categoriesForScope = (scope) =>
    scope === SCOPE_PERSONAL ? PERSONAL_CATEGORIES : BUSINESS_CATEGORIES

  // [{ value, label }] for <select> dropdowns.
  const categoryOptionsForScope = (scope) =>
    categoriesForScope(scope).map((key) => ({ value: key, label: labels.value[key] || key }))

  // [{ key, label, icon, bgColor, iconColor }] for summary cards.
  const categoryCardsForScope = (scope) =>
    categoriesForScope(scope).map((key) => ({ key, label: labels.value[key] || key, ...META[key] }))

  const getCategoryLabel = (key) => labels.value[key] || key

  const scopeLabel = (scope) =>
    scope === SCOPE_PERSONAL ? labels.value.scope_personal
      : scope === SCOPE_BUSINESS ? labels.value.scope_business
        : labels.value.scope_all

  return {
    SCOPE_BUSINESS,
    SCOPE_PERSONAL,
    BUSINESS_CATEGORIES,
    PERSONAL_CATEGORIES,
    categoriesForScope,
    categoryOptionsForScope,
    categoryCardsForScope,
    getCategoryLabel,
    scopeLabel,
  }
}
