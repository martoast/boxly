<!-- pages/app/account/complete-profile.vue -->
<template>
  <section
    class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20"
  >
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Header -->
      <div class="text-center mb-8 animate-fadeIn">
        <div
          class="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-primary-50 rounded-2xl mb-4 sm:mb-6 shadow-lg"
        >
          <svg
            class="w-10 h-10 sm:w-12 sm:h-12"
            viewBox="0 0 150 100"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <g
              stroke="#0d2c4f"
              stroke-width="5"
              stroke-linejoin="round"
              stroke-linecap="round"
            >
              <line x1="0" y1="35" x2="40" y2="35" />
              <line x1="5" y1="50" x2="45" y2="50" />
              <line x1="0" y1="65" x2="40" y2="65" />
              <path fill="#FFC107" d="M 55,25 L 105,25 L 125,45 L 75,45 Z" />
              <path fill="#FFA000" d="M 55,25 L 55,75 L 75,95 L 75,45 Z" />
              <path fill="#FF8F00" d="M 75,95 L 125,95 L 125,45 L 75,45 Z" />
            </g>
          </svg>
        </div>
        <h1
          class="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 mb-2"
        >
          {{ t.completeProfileTitle }}
        </h1>
        <p class="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
          {{ t.completeProfileSubtitle }}
        </p>
      </div>

      <!-- Error Alert -->
      <Transition
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="errorMessage || Object.keys(errors).length > 0"
          class="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-md"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="w-5 h-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-red-800">
                {{ errorMessage || t.validationError }}
              </p>
              <ul
                v-if="Object.keys(errors).length > 0"
                class="mt-2 text-sm text-red-700 space-y-1"
              >
                <li v-for="(messages, field) in errors" :key="field">
                  {{ messages[0] }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Form -->
      <div
        class="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 md:p-8"
      >
        <form @submit.prevent="handleSubmit" class="space-y-5 sm:space-y-6">
          <!-- Phone Field with Validation Component -->
          <PhoneValidationInput
            ref="phoneInputRef"
            v-model="form.phone"
            :label="t.phoneLabel"
            :placeholder="t.phonePlaceholder"
            :help-text="t.phoneHelp"
            input-id="complete-profile-phone"
            :required="true"
            @validation-change="handlePhoneValidation"
          />

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading || !canProceed"
            class="w-full px-6 py-3.5 rounded-xl inline-flex items-center justify-center gap-2 font-semibold text-base no-underline border-2 border-transparent cursor-pointer transition-all duration-300 bg-primary-500 text-white shadow-lg hover:bg-primary-600 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
          >
            <svg
              v-if="loading"
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span v-if="!loading">{{ t.completeButton }}</span>
            <span v-else>{{ t.savingButton }}</span>
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";

// Define page meta
definePageMeta({
  layout: "empty",
  middleware: "auth",
});

// Nuxt imports
const { $customFetch, $retriveUser } = useNuxtApp();
const route = useRoute();

// Use the language composable
const { t: createTranslations } = useLanguage();

// State
const form = ref({
  phone: "",
});

const phoneInputRef = ref(null);
const phoneValidation = ref({
  isValid: false,
  e164Phone: "",
  formattedPhone: "",
});

const loading = ref(false);
const errorMessage = ref("");
const errors = ref({});
const userState = useState("user");

// Get redirect parameter from route
const redirectTo = route.query.redirect || "/app/";

// Get registration source from query params or tracking parameter
const registrationSource = computed(() => {
  // Check if we have tracking data passed from OAuth
  if (route.query.tracking) {
    return route.query.tracking;
  }

  // Otherwise build from individual params (for direct navigation)
  const params = route.query;
  const trackingData = {
    utm_source: params.utm_source || null,
    utm_medium: params.utm_medium || null,
    utm_campaign: params.utm_campaign || null,
    utm_content: params.utm_content || null,
    utm_term: params.utm_term || null,
    fbclid: params.fbclid || null,
    gclid: params.gclid || null,
    landing_page: params.source || null,
    referrer: document.referrer || null,
    timestamp: new Date().toISOString(),
  };

  // Only return if we have tracking data
  const hasTrackingData = Object.values(trackingData).some(
    (value) => value !== null
  );
  return hasTrackingData ? JSON.stringify(trackingData) : null;
});

// Define translations
const translations = {
  completeProfileTitle: {
    es: "Completa tu Perfil",
    en: "Complete Your Profile",
  },
  completeProfileSubtitle: {
    es: "Cuéntanos un poco sobre ti para personalizar tu experiencia",
    en: "Tell us a bit about yourself to personalize your experience",
  },
  phoneLabel: {
    es: "Número de Teléfono",
    en: "Phone Number",
  },
  phonePlaceholder: {
    es: "+52 664 123 4567 o +1 619 123 4567",
    en: "+1 619 123 4567 or +52 664 123 4567",
  },
  phoneHelp: {
    es: "Incluye el código de país con +. Ejemplos: +52 para México, +1 para USA",
    en: "Include country code with +. Examples: +1 for USA, +52 for Mexico",
  },
  completeButton: {
    es: "Completar Perfil",
    en: "Complete Profile",
  },
  savingButton: {
    es: "Guardando...",
    en: "Saving...",
  },
  generalError: {
    es: "Ocurrió un error. Por favor, intenta de nuevo.",
    en: "An error occurred. Please try again.",
  },
  validationError: {
    es: "Por favor corrige los siguientes errores:",
    en: "Please correct the following errors:",
  },
};

// Get reactive translations
const t = createTranslations(translations);

// Handle phone validation changes from component
const handlePhoneValidation = (validation) => {
  phoneValidation.value = validation;
};

// Form validation
const canProceed = computed(() => {
  return phoneValidation.value.isValid;
});

// Methods
const clearErrors = () => {
  errorMessage.value = "";
  errors.value = {};
};

const handleSubmit = async () => {
  // Trigger validation on the phone component
  if (phoneInputRef.value && !(await phoneInputRef.value.validate())) {
    return;
  }

  if (!phoneValidation.value.isValid) {
    return;
  }

  loading.value = true;
  clearErrors();

  try {
    // Build update payload
    const updateData = {
      phone: phoneValidation.value.e164Phone, // Use E.164 format from component
    };

    // Add registration source if available and user doesn't already have it
    if (
      registrationSource.value &&
      (!userState.value.registration_source ||
        userState.value.registration_source === null)
    ) {
      updateData.registration_source = registrationSource.value;
    }

    // Update profile
    await $customFetch("/profile", {
      method: "PUT",
      body: updateData,
    });

    // Refresh user data
    await $retriveUser();

    // Success - redirect to intended page
    return navigateTo(redirectTo);
  } catch (error) {
    console.error("Profile update error:", error);

    if (error.data) {
      if (error.data.errors) {
        errors.value = error.data.errors;
      }
      if (error.data.message) {
        errorMessage.value = error.data.message;
      }
    } else {
      errorMessage.value = t.value.generalError;
    }
  } finally {
    loading.value = false;
  }
};

// Check if user actually needs to complete profile
onMounted(async () => {
  // Try to get user data
  try {
    await $retriveUser();
  } catch (error) {
    // If can't get user, they're not logged in properly
    console.error("Could not fetch user:", error);
    await navigateTo("/login");
    return;
  }

  // If user already has phone, redirect
  if (userState.value && userState.value.phone) {
    await navigateTo(redirectTo);
  }
});
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.6s ease-out;
}
</style>