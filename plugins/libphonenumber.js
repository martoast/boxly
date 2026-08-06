// libphonenumber-js is ~35 KB gz and used by exactly 2 consumers
// (PhoneValidationInput.vue, pages/app/account/edit.vue). Provide an
// async getter that dynamic-imports it on first use instead of eagerly
// bundling it into every page's entry chunk.

let modulePromise = null
const loadModule = () => {
  if (!modulePromise) modulePromise = import('libphonenumber-js')
  return modulePromise
}

export default defineNuxtPlugin(() => {
  return {
    provide: {
      phone: {
        async parse(...args) {
          const { parsePhoneNumber } = await loadModule()
          return parsePhoneNumber(...args)
        },
        async isValid(...args) {
          const { isValidPhoneNumber } = await loadModule()
          return isValidPhoneNumber(...args)
        },
        async asYouType(...args) {
          const { AsYouType } = await loadModule()
          return new AsYouType(...args)
        }
      }
    }
  }
})
