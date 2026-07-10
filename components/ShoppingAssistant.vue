<template>
  <div class="flex bg-gray-50 overflow-hidden relative" :class="standalone ? 'h-[100dvh]' : (fullscreenMobile ? 'h-[100dvh] md:h-[calc(100dvh-4rem)]' : 'h-[calc(100dvh-4rem)]')">
    <!-- Error toast (e.g. a failed send) — otherwise a failure looks like silence -->
    <Transition name="pop">
      <div v-if="chatError" class="absolute bottom-24 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-xl bg-red-600 text-white text-sm font-semibold px-4 py-2.5 shadow-lg">
        <span>{{ chatError }}</span>
        <button type="button" @click="chatError = ''" class="ml-1 opacity-80 hover:opacity-100" aria-label="Cerrar">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </Transition>
    <!-- ===== Mobile history drawer ===== -->
    <Transition name="backdrop">
      <div v-if="showSidebar && drawerOpen" class="md:hidden absolute inset-0 z-40 bg-black/30 backdrop-blur-sm" @click="drawerOpen = false" />
    </Transition>
    <Transition name="drawer">
      <aside v-if="showSidebar && drawerOpen" class="md:hidden absolute inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col shadow-2xl">
        <ConversationsList :conversations="conversations" :active-id="activeId" :user="user" :show-profile="standalone" :hub="hub" @new="newChat" @open="openChat" @delete="deleteConversation" @memory="showMemory = true" @logout="logout" />
      </aside>
    </Transition>

    <!-- ===== Desktop sidebar (collapsible icon rail, ChatGPT-style) ===== -->
    <aside v-if="showSidebar" class="hidden md:flex md:flex-col shrink-0 border-r border-gray-200 bg-white transition-[width] duration-200 ease-out" :class="sidebarCollapsed ? 'w-16' : 'w-72'">
      <ConversationsList :conversations="conversations" :active-id="activeId" :collapsed="sidebarCollapsed" :user="user" :show-profile="standalone" :hub="hub" @new="newChat" @open="openChat" @delete="deleteConversation" @memory="showMemory = true" @toggle="toggleSidebar" @logout="logout" />
    </aside>

    <!-- ===== Chat area ===== -->
    <main class="flex-1 flex flex-col min-w-0">
      <!-- Mobile top bar (history access) -->
      <header v-if="showSidebar" class="md:hidden flex items-center justify-between px-3 min-h-[3rem] border-b border-gray-100 bg-white/80 backdrop-blur shrink-0" :class="(fullscreenMobile || standalone) ? 'pt-[env(safe-area-inset-top)]' : ''">
        <button @click="drawerOpen = true" class="p-2 -ml-1 rounded-lg text-gray-600 active:scale-90 transition-transform" aria-label="Historial">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <span class="text-sm font-semibold text-gray-700 truncate px-2">{{ activeTitle }}</span>
        <div class="flex items-center">
          <button v-if="user" @click="showMemory = true" class="p-2 rounded-lg text-gray-600 active:scale-90 transition-transform" aria-label="Tu perfil de compras">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          </button>
          <button @click="newChat" class="p-2 -mr-1 rounded-lg text-primary-600 active:scale-90 transition-transform" aria-label="Nuevo chat">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          </button>
        </div>
      </header>

      <!-- ===== LOADING A CONVERSATION (from history) ===== -->
      <div v-if="loadingChat" class="flex-1 overflow-hidden px-3 md:px-4 py-5">
        <div class="max-w-2xl mx-auto space-y-4 animate-pulse">
          <div class="flex justify-end"><div class="h-9 w-40 rounded-3xl rounded-br-lg bg-primary-200/60"></div></div>
          <div class="flex justify-start"><div class="h-24 w-3/4 rounded-3xl rounded-bl-lg bg-gray-200"></div></div>
          <div class="flex justify-end"><div class="h-9 w-28 rounded-3xl rounded-br-lg bg-primary-200/60"></div></div>
          <div class="flex justify-start"><div class="h-20 w-2/3 rounded-3xl rounded-bl-lg bg-gray-200"></div></div>
          <div class="flex justify-center pt-2"><span class="text-xs text-gray-400">Cargando conversación…</span></div>
        </div>
      </div>

      <!-- ===== HUB EMPTY STATE (logged-in dashboard) — welcome + the four pipeline
                 action cards. Tapping a card primes that workflow (placeholder +
                 routing hint); the AI runs once the user provides input. ===== -->
      <Transition name="fade-fast">
        <div v-if="hub && !loadingChat && !chat.messages.length && !activeId" class="flex-1 overflow-y-auto px-4 md:px-5 pt-6 pb-6">
          <div class="max-w-2xl mx-auto">
            <!-- ===== WOW HERO — the promise, in one glance: all of the US, at your door in MX ===== -->
            <div v-if="!activePipeline" class="relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-primary-600 via-primary-600 to-indigo-700 text-white p-6 md:p-8 shadow-xl shadow-primary-600/25 mb-3 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.008] hover:shadow-2xl hover:shadow-primary-600/40">
              <span class="absolute -top-16 -right-12 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none"></span>
              <span class="absolute -bottom-20 -left-12 w-60 h-60 rounded-full bg-indigo-400/25 blur-3xl pointer-events-none"></span>
              <svg class="absolute top-6 right-7 w-5 h-5 text-amber-300/90 pointer-events-none animate-pulse" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.7 5.6L19 9l-5.3 1.4L12 16l-1.7-5.6L5 9l5.3-1.4z" /></svg>
              <div class="relative">
                <span class="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-wide text-white/85 bg-white/10 border border-white/15 rounded-full px-3 py-1">🇺🇸 → 🇲🇽 De EE. UU. a tu casa en México</span>
                <h1 class="mt-3.5 text-[27px] md:text-[38px] font-extrabold leading-[1.06] tracking-tight">Compra en EE. UU. como<br class="hidden sm:block"> si vivieras allá.</h1>
                <p class="mt-2.5 text-[14.5px] md:text-[16.5px] text-white/85 max-w-xl leading-snug">Compra en cualquier tienda de EE. UU.<br>¿No puedes comprar? Lo hacemos por ti. ¿Ya compraste? Envíalo a tu casillero Boxly. Nosotros lo llevamos a tu casa en México.</p>
                <NuxtLink to="/app/search" class="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-primary-700 text-[14.5px] font-bold shadow-lg shadow-primary-900/20 hover:bg-white/95 active:scale-[.98] transition">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.7 5.6L19 9l-5.3 1.4L12 16l-1.7-5.6L5 9l5.3-1.4z" /></svg>
                  Buscar y cotizar con IA
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </NuxtLink>
                <!-- store proof -->
                <div class="relative mt-6 overflow-hidden select-none -mx-6 md:-mx-8" aria-hidden="true">
                  <div class="flex w-max gap-8 whitespace-nowrap marquee-track px-6 md:px-8">
                    <span v-for="(b, i) in marqueeStores" :key="i" class="text-[12.5px] font-bold tracking-tight text-white/60">{{ b }}</span>
                  </div>
                  <div class="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-primary-600 to-transparent"></div>
                  <div class="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-indigo-700 to-transparent"></div>
                </div>
              </div>
            </div>

            <!-- input — shown only in search/register mode (revealed from a card/CTA) -->
            <div v-if="activePipeline" class="mb-2.5 rounded-[1.7rem] transition-shadow duration-300 hover:shadow-lg hover:shadow-primary-500/10 focus-within:shadow-xl focus-within:shadow-primary-500/10">
              <AssistantComposer ref="composerRef" large v-model:text="input" :mic-recording="micRecording" :mic-transcribing="micTranscribing" :mic-levels="micLevels" :mic-error="micError" :busy="isBusy" :placeholder="composerPlaceholder" @send="onComposerSend" @mic="toggleMic" />
            </div>

            <!-- clickable pills (Perplexity-style) — quick primers while searching -->
            <div v-if="activePipeline === 'search'" class="flex flex-wrap gap-2 mb-5 px-1">
              <button
                v-for="(p, i) in QUICK_PILLS"
                :key="p.label"
                @click="p.run()"
                @mouseenter="hoverText = p.hover"
                @mouseleave="hoverText = null"
                class="chip-in group inline-flex items-center gap-1.5 text-[12.5px] font-medium text-gray-600 bg-white border border-gray-200 hover:border-primary-300 hover:text-primary-700 rounded-full pl-2.5 pr-3 py-1.5 transition-colors active:scale-95"
                :style="{ animationDelay: (0.75 + i * 0.08) + 's' }"
              >
                <svg class="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.9" :d="ICONS[p.icon]" /></svg>
                {{ p.label }}
              </button>
            </div>

            <!-- active-pipeline context chip: the composer "changes" to that workflow -->
            <Transition name="fade-fast">
              <div v-if="activePipelineMeta" class="mb-4 flex items-center gap-2 text-[13px]">
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 font-semibold">{{ activePipelineMeta.title }}</span>
                <span class="text-gray-400">{{ activePipelineMeta.sub }}</span>
                <button @click="clearPipeline" class="ml-auto text-gray-400 hover:text-gray-600 text-xs font-medium">Cambiar</button>
              </div>
            </Transition>

            <!-- REGISTER pipeline: the concierge greets, then receipt upload → preview → order -->
            <div v-if="activePipeline === 'register'">
              <p v-if="!pendingReceipt && !receiptSuccess" class="text-[14.5px] text-gray-700 font-medium mb-3">Perfecto. Cuéntame qué compraste o sube tu comprobante.</p>
              <div v-if="receiptSuccess" class="rounded-2xl bg-green-50 border border-green-200 p-4 max-w-md">
                <p class="text-[14px] font-bold text-green-800 flex items-center gap-1.5"><svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clip-rule="evenodd"/></svg> Pedido registrado</p>
                <p class="text-[12px] text-green-700 mt-1">Tu pedido <span class="font-semibold">{{ receiptSuccess.order_number }}</span> quedó creado. Lo recibimos en EE. UU., lo consolidamos y te avisamos. Sin comisión — solo pagas la caja.</p>
                <div class="flex items-center gap-2 mt-3">
                  <NuxtLink to="/app/orders" class="text-[12px] font-semibold text-green-800 underline active:scale-95 transition">Ver mis pedidos →</NuxtLink>
                  <button @click="receiptSuccess = null" class="text-[12px] font-semibold text-gray-500 hover:text-gray-700">Registrar otro</button>
                </div>
              </div>
              <ReceiptPreviewCard
                v-else-if="pendingReceipt"
                :items="pendingReceipt.items"
                :store="pendingReceipt.store"
                :address="receiptAddress"
                :loading="receiptLoading"
                :error="receiptError"
                @confirm="submitReceipt"
                @cancel="cancelReceipt"
              />
              <UploadDropzone v-else :busy="receiptBusy" @file="onReceiptFile" />
              <p v-if="!pendingReceipt && !receiptSuccess" class="text-[12px] text-gray-400 text-center mt-3">…o escribe arriba qué compraste y lo registro contigo.</p>
            </div>

            <!-- The default lobby: address + two intent cards + current shipment. -->
            <div v-if="!activePipeline">
              <!-- Card 2 — your US address. -->
              <div class="relative w-full rounded-[1.6rem] border border-primary-100 p-5 md:p-6 overflow-hidden bg-gradient-to-br from-white via-white to-primary-50/60 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-xl">
                <span class="absolute -top-10 -right-8 w-40 h-40 rounded-full bg-primary-200/30 blur-3xl pointer-events-none"></span>
                <div class="relative flex items-start gap-4">
                  <span class="grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" :d="ICONS.pin" /></svg>
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="text-[11px] font-bold uppercase tracking-widest text-primary-700">Tu dirección en Estados Unidos</p>
                    <div class="mt-1.5 text-[15px] leading-snug">
                      <p class="font-bold text-gray-900">BOXLY {{ user?.name || '' }}</p>
                      <p class="text-gray-700">157 Virginia Ave Suite 835</p>
                      <p class="text-gray-700">San Ysidro, CA 92173</p>
                    </div>
                  </div>
                  <!-- Desktop: tutorial sits top-right of the address. Wrapped in a span
                       that owns the responsive display — the button's own baked-in
                       `inline-flex` would otherwise beat a `hidden` passed to it, so it
                       leaked onto mobile and showed twice. -->
                  <span class="hidden sm:inline-flex shrink-0">
                    <TutorialVideoButton loom-id="34cef0546fd64ca3bf8f11fa89c156cc" />
                  </span>
                </div>
                <!-- On mobile the tutorial button gets its own row so it never crowds the address -->
                <div class="relative mt-3 sm:hidden">
                  <TutorialVideoButton loom-id="34cef0546fd64ca3bf8f11fa89c156cc" />
                </div>
                <NuxtLink to="/app/pricing" class="relative mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-600 hover:text-primary-600 transition-colors group">
                  <svg class="w-4 h-4 shrink-0 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" :d="ICONS.box" /></svg>
                  Ver precios y cómo funciona
                  <svg class="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                </NuxtLink>
                <div class="relative flex flex-wrap items-center gap-2 mt-3.5">
                  <button type="button" @click="copyUsAddress" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-[13px] font-semibold transition active:scale-95">
                    <svg v-if="!addressCopied" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {{ addressCopied ? '¡Copiado!' : 'Copiar dirección' }}
                  </button>
                  <NuxtLink to="/app/casillero?from=/app" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-gray-600 text-[13px] font-semibold hover:bg-gray-50 hover:border-gray-300 transition active:scale-95">
                    <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="ICONS.pin"/></svg>
                    Entrega en persona
                  </NuxtLink>
                </div>
              </div>

              <!-- Card 3 — create the shipment (I already know what I'm sending). -->
              <NuxtLink
                to="/app/orders/create"
                class="group relative mt-3 flex items-center gap-4 rounded-[1.6rem] border border-gray-200 bg-white p-5 md:p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-xl hover:border-primary-200"
              >
                <span class="relative grid place-items-center w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors shrink-0">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" :d="ICONS.box" /></svg>
                  <span class="absolute -top-1 -right-1 grid place-items-center w-4 h-4 rounded-full bg-primary-500 text-white shadow-sm">
                    <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.2" d="M12 5v14M5 12h14" /></svg>
                  </span>
                </span>
                <div class="min-w-0 flex-1">
                  <p class="text-[16px] font-bold text-gray-900 leading-tight">Crear mi envío</p>
                  <p class="text-[13px] text-gray-500 mt-0.5">Ya sé qué enviar — crea tu orden en segundos.</p>
                </div>
                <svg class="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
              </NuxtLink>

              <!-- Shipment history — a quiet link, not a product-like card -->
              <NuxtLink to="/app/orders" class="mt-4 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-primary-600 transition-colors group">
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" :d="ICONS.box" /></svg>
                Ver mis envíos
                <svg class="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
              </NuxtLink>
            </div>
          </div>
        </div>
      </Transition>

      <!-- ===== EMPTY STATE — ChatGPT-style: title, subtitle, the input box, then
                 the picture cards. Tapping a card sends its prompt. ===== -->
      <Transition name="fade-fast">
        <div v-if="!hub && !loadingChat && !chat.messages.length && !activeId" class="flex-1 overflow-y-auto px-4 md:px-5 pt-5 pb-6">
          <div class="max-w-2xl mx-auto">
            <h1 class="text-[26px] md:text-3xl font-extrabold text-gray-900 tracking-tight">Compra en Estados Unidos</h1>
            <p class="text-gray-500 mt-1 mb-4 text-[14px] md:text-[15px]">Escribe lo que buscas o toca una idea — Boxly lo consigue, lo importa y te lo entrega en México.</p>

            <!-- input at the top -->
            <div class="mb-6">
              <AssistantComposer ref="composerRef" v-model:text="input" :mic-recording="micRecording" :mic-transcribing="micTranscribing" :mic-levels="micLevels" :mic-error="micError" :busy="isBusy" placeholder="Compra lo que sea…" @send="onComposerSend" @mic="toggleMic" />
            </div>

            <!-- Centered loader until every card image is resolved + decoded, then
                 reveal the whole grid at once (no emoji-then-image pop-in). -->
            <Transition name="fade-fast" mode="out-in">
              <div v-if="!cardsReady" key="cards-loading" class="py-16 grid place-items-center">
                <svg class="w-7 h-7 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
              </div>
              <div v-else key="cards-ready">
                <!-- featured (first) card -->
                <button
                  v-if="suggestions[0]"
                  :key="suggestions[0].text"
                  @click="pickSuggestion(suggestions[0].text)"
                  class="group relative block w-full h-44 md:h-52 rounded-3xl overflow-hidden mb-3 text-left active:scale-[.99] transition-transform shadow-sm"
                  :class="`bg-gradient-to-br ${suggestions[0].grad}`"
                >
                  <img v-if="cardImg(suggestions[0])" :src="cardImg(suggestions[0])" @error="onCardImgError(suggestions[0])" referrerpolicy="no-referrer" class="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <span v-else class="absolute inset-0 grid place-items-center text-[84px] opacity-90 select-none transition-transform group-hover:scale-105">{{ suggestions[0].emoji }}</span>
                  <span class="absolute top-3 left-3 text-[12px] font-bold text-gray-800 bg-white/90 backdrop-blur rounded-full px-2.5 py-1 shadow-sm">Pruébalo</span>
                  <span class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent pointer-events-none"></span>
                  <span class="absolute left-4 bottom-3.5 right-4 text-white text-lg md:text-xl font-bold leading-snug drop-shadow">{{ suggestions[0].title || suggestions[0].text }}</span>
                </button>

                <!-- grid of the rest -->
                <div :key="'grid'" class="grid grid-cols-2 gap-3">
                  <button
                    v-for="s in suggestions.slice(1)"
                    :key="s.text"
                    @click="pickSuggestion(s.text)"
                    class="group relative block aspect-[4/5] rounded-2xl overflow-hidden text-left active:scale-[.98] transition-transform shadow-sm"
                    :class="`bg-gradient-to-br ${s.grad}`"
                  >
                    <img v-if="cardImg(s)" :src="cardImg(s)" @error="onCardImgError(s)" referrerpolicy="no-referrer" class="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <span v-else class="absolute inset-0 grid place-items-center text-[60px] opacity-90 select-none transition-transform group-hover:scale-105">{{ s.emoji }}</span>
                    <span class="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 to-transparent pointer-events-none"></span>
                    <span class="absolute left-3 bottom-2.5 right-3 text-white text-[15px] font-bold leading-snug drop-shadow">{{ s.title || s.text }}</span>
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>

      <!-- ===== CHAT STATE ===== -->
      <template v-if="!loadingChat && (chat.messages.length || activeId)">
        <div ref="scroller" @scroll.passive="onScroll" class="flex-1 overflow-y-auto overscroll-contain px-3 md:px-4 py-5 scroll-smooth">
          <div v-if="loadingOlder" class="flex justify-center pb-3">
            <svg class="w-5 h-5 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
          </div>
          <TransitionGroup tag="div" name="msg" class="max-w-2xl mx-auto space-y-4">
            <div v-for="m in chat.messages" :key="m.id" :class="m.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
              <div :class="m.role === 'user' ? 'bg-primary-500 text-white rounded-3xl rounded-br-lg px-4 py-2.5 max-w-[85%] shadow-sm' : 'w-full max-w-[95%] space-y-3'">
                <!-- USER: their text + any uploaded image -->
                <template v-if="m.role === 'user'">
                  <div v-if="msgText(m)" class="whitespace-pre-wrap text-[15px] leading-relaxed">{{ msgText(m) }}</div>
                  <template v-for="(part, i) in m.parts" :key="'uf' + i">
                    <img v-if="part.type === 'file' && String(part.mediaType).startsWith('image/')" :src="part.url" class="rounded-2xl max-h-56 w-auto border border-gray-200 shadow-sm ml-auto" />
                    <!-- PDF (or other non-image file): a compact chip so it's clearly attached -->
                    <a v-else-if="part.type === 'file'" :href="part.url" target="_blank" rel="noopener" class="mt-1 ml-auto flex items-center gap-2 w-fit max-w-[240px] rounded-xl bg-white/15 px-2.5 py-1.5 hover:bg-white/25 transition">
                      <span class="shrink-0 grid place-items-center w-7 h-7 rounded-lg bg-white/20">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14 3v5h5"/></svg>
                      </span>
                      <span class="min-w-0 truncate text-[13px] font-semibold">{{ part.filename || (String(part.mediaType).includes('pdf') ? 'Documento PDF' : 'Archivo') }}</span>
                    </a>
                  </template>
                </template>

                <!-- ASSISTANT: chronological order — the GALLERY renders first (it's ready
                     before the AI's reply, which only starts after the products are in
                     context), THEN the text bubble underneath, THEN the action widgets. -->
                <template v-else>
                  <!-- 1) Gallery (+ its loading / no-results states) on top -->
                  <template v-for="(part, i) in m.parts" :key="'g' + i">
                    <ProductGallery v-if="isGalleryTool(part) && part.state === 'output-available' && part.output?.products?.length" :products="part.output.products" @open="openProduct" />
                    <!-- Search/browse finished but found nothing — clean message, not an empty
                         carousel. Suppress it if ANOTHER search in this turn did find options. -->
                    <div v-else-if="showNoResults(m, part)" class="text-[13px] text-gray-500 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">No encontré opciones para eso ahora. ¿Probamos con otra marca o término?</div>

                    <SearchLoader v-else-if="part.type === 'tool-search_products' && part.state !== 'output-available'" />

                    <SearchLoader
                      v-else-if="(part.type === 'tool-browse_store' || part.type === 'tool-browse_stores') && part.state !== 'output-available'"
                      :messages="['Revisando tiendas…', 'Abriendo el catálogo…', 'Trayendo lo mejor de la tienda…']"
                    />

                    <div v-else-if="part.type === 'tool-web_search' && part.state !== 'output-available'" class="flex items-center gap-2 text-xs text-gray-400 pl-1">
                      <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                      Buscando información…
                    </div>

                    <!-- Order tracking (hub): a single order's status timeline OR a tappable list. -->
                    <template v-else-if="part.type === 'tool-show_orders' && part.state === 'output-available'">
                      <OrderStatusTimeline v-if="part.output?.order" :order="part.output.order" />
                      <OrderList v-else-if="part.output?.orders" :orders="part.output.orders" @track="trackOrder" />
                    </template>
                    <div v-else-if="part.type === 'tool-show_orders' && part.state !== 'output-available'" class="flex items-center gap-2 text-xs text-gray-400 pl-1">
                      <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                      Buscando tus pedidos…
                    </div>

                    <!-- In-person planner (Las Americas) → create PR + deposit checkout. -->
                    <template v-else-if="part.type === 'tool-plan_in_person' && part.state === 'output-available'">
                      <DepositCheckoutCard v-if="inPersonResult" :checkout-url="inPersonResult.checkoutUrl" :deposit="inPersonResult.deposit" :request-number="inPersonResult.requestNumber" />
                      <InPersonPlanner v-else :plan="part.output" :loading="inPersonLoading" :error="inPersonError" @confirm="submitInPerson" />
                    </template>
                    <div v-else-if="part.type === 'tool-plan_in_person' && part.state !== 'output-available'" class="flex items-center gap-2 text-xs text-gray-400 pl-1">
                      <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                      Preparando el planificador…
                    </div>
                  </template>

                  <!-- 2) The AI's reply, UNDERNEATH the gallery -->
                  <div v-if="msgText(m)" class="bg-white border border-gray-100 rounded-3xl rounded-bl-lg px-4 py-3 shadow-sm text-[15px]"><MarkdownText :text="msgText(m)" /></div>

                  <!-- 3) Action widgets + follow-ups after the reply -->
                  <template v-for="(part, i) in m.parts" :key="'w' + i">
                    <ShipmentCard v-if="part.type === 'tool-show_shipment' && part.state === 'output-available'" :shipment="part.output" @order="onFinalizeShipment" @add="onAddMore" />

                    <AssistedPurchaseCard v-else-if="part.type === 'tool-show_assisted_summary' && part.state === 'output-available'" :summary="part.output" @confirm="confirmAssisted" @edit="editAssisted" />

                    <BoxGuide v-else-if="part.type === 'tool-show_box_guide' && part.state === 'output-available'" :boxes="part.output?.boxes || []" />

                    <div v-else-if="part.type === 'tool-create_purchase_request' && part.state === 'output-available' && part.output?.request_number" class="bg-green-50 border border-green-200 rounded-2xl p-4 max-w-sm">
                      <p class="text-sm font-bold text-green-800 flex items-center gap-1.5"><svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clip-rule="evenodd"/></svg> Listo — nosotros nos encargamos 🎉</p>
                      <p class="text-xs text-green-700 mt-1">Solicitud <span class="font-semibold">{{ part.output.request_number }}</span> creada. Te enviamos la cotización (producto + servicio + envío) para que la apruebes — no pagas nada todavía.</p>
                      <NuxtLink to="/app/purchase-requests" class="inline-block mt-2 text-xs font-semibold text-green-800 underline active:scale-95 transition-transform">Ver mis solicitudes →</NuxtLink>
                    </div>

                    <!-- Self-import order registered → rich confirmation card -->
                    <div v-else-if="part.type === 'tool-create_self_order' && part.state === 'output-available' && part.output?.success && part.output?.order_number" class="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-white p-4 max-w-md shadow-sm">
                      <div class="flex items-center gap-2">
                        <span class="grid place-items-center w-8 h-8 rounded-full bg-emerald-500 text-white shrink-0"><svg class="w-4.5 h-4.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clip-rule="evenodd"/></svg></span>
                        <div>
                          <p class="text-sm font-bold text-gray-900 leading-tight">Pedido registrado</p>
                          <p class="text-[12px] text-gray-500 leading-tight">Guarda tu número: <span class="font-semibold text-gray-700">{{ part.output.order_number }}</span></p>
                        </div>
                      </div>
                      <ul v-if="(part.output.items || []).length" class="mt-3 space-y-1 border-t border-emerald-100 pt-2.5">
                        <li v-for="(it, ii) in part.output.items" :key="ii" class="flex items-center justify-between gap-2 text-[13px] text-gray-700">
                          <span class="truncate">{{ it.quantity > 1 ? it.quantity + '× ' : '' }}{{ it.title }}</span>
                          <span v-if="it.price" class="shrink-0 font-semibold text-gray-500">${{ it.price }}</span>
                        </li>
                      </ul>
                      <p class="text-[11.5px] text-gray-400 mt-2.5">Lo recibimos en San Diego, lo consolidamos y te avisamos. Pagas la caja al enviar.</p>
                      <div class="flex flex-wrap items-center gap-2 mt-3">
                        <NuxtLink to="/app/orders" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-semibold active:scale-95 transition-all">Ver mi envío →</NuxtLink>
                        <NuxtLink to="/app/pricing" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-[12.5px] font-semibold hover:bg-gray-50 active:scale-95 transition-all">💰 Precios de cajas</NuxtLink>
                      </div>
                    </div>

                    <!-- Tappable follow-ups (cross-sell / build-the-set) -->
                    <div v-else-if="part.type === 'tool-suggest_followups' && part.state === 'output-available' && part.output?.suggestions?.length" class="flex flex-wrap gap-2 mt-1">
                      <button
                        v-for="(s, si) in part.output.suggestions" :key="si"
                        @click="sendFollowup(s)" :disabled="isBusy"
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 text-[12.5px] font-medium hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed text-left"
                      >
                        <svg class="w-3.5 h-3.5 shrink-0 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                        <span>{{ s }}</span>
                      </button>
                    </div>
                  </template>
                </template>
              </div>
            </div>
          </TransitionGroup>

          <div v-if="showTyping" class="max-w-2xl mx-auto mt-4 flex justify-start">
            <div class="bg-white border border-gray-100 rounded-3xl rounded-bl-lg px-4 py-3.5 shadow-sm">
              <span class="typing"><i></i><i></i><i></i></span>
            </div>
          </div>

          <Transition name="pop">
            <div v-if="pendingAccount" class="max-w-sm mx-auto mt-5 bg-white border border-primary-200 rounded-2xl p-4 shadow-lg ring-1 ring-primary-100">
              <p class="text-sm font-bold text-gray-900 mb-0.5">Continúa con tu cuenta Boxly 🛍️</p>
              <p class="text-xs text-gray-500 mb-3">Necesitas tu cuenta Boxly para hacer el pedido. Crea una o inicia sesión — te traemos de vuelta justo aquí, con tu pedido listo para confirmar.</p>
              <button @click="goRegister" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 active:scale-[.98] text-white text-sm font-bold rounded-xl transition-all">
                Crear cuenta y continuar
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
              <button @click="goLogin" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-2 border border-gray-200 hover:bg-gray-50 active:scale-[.98] text-gray-700 text-sm font-semibold rounded-xl transition-all">
                Ya tengo cuenta · Iniciar sesión
              </button>
            </div>
          </Transition>

          <!-- First-use soft conversion gate (guest only, once) -->
          <Transition name="pop">
            <div v-if="softGate" class="max-w-sm mx-auto mt-5 bg-white border border-primary-200 rounded-2xl p-4 shadow-lg ring-1 ring-primary-100">
              <p class="text-sm font-bold text-gray-900 mb-0.5">Guarda tu búsqueda con una cuenta ✨</p>
              <p class="text-xs text-gray-500 mb-3">Crea tu cuenta Boxly gratis para guardar tus productos y pedir cuando quieras — te traemos justo aquí para seguir chateando.</p>
              <button @click="dismissSoftGate(); goRegister()" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 active:scale-[.98] text-white text-sm font-bold rounded-xl transition-all">
                Crear cuenta gratis
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
              <button @click="dismissSoftGate(); goLogin()" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-2 border border-gray-200 hover:bg-gray-50 active:scale-[.98] text-gray-700 text-sm font-semibold rounded-xl transition-all">
                Ya tengo cuenta · Iniciar sesión
              </button>
              <button @click="dismissSoftGate" class="w-full mt-2 px-4 py-2 text-gray-400 hover:text-gray-600 text-xs font-medium transition-colors">
                Seguir explorando
              </button>
            </div>
          </Transition>

          <!-- Cancel-order confirmation gate (client-executed cancel_order tool) -->
          <Transition name="pop">
            <div v-if="pendingCancel" class="max-w-sm mx-auto mt-5">
              <ConfirmDialog
                title="¿Cancelar este pedido?"
                :message="`Vas a cancelar el pedido ${pendingCancel.order_number}. Esta acción no se puede deshacer.`"
                confirm-label="Sí, cancelar"
                cancel-label="No, conservar"
                danger
                :loading="cancelLoading"
                :error="cancelErrorMsg"
                @confirm="submitCancel"
                @cancel="dismissCancel"
              />
            </div>
          </Transition>

          <!-- "Ya lo compré yo" → confirm address + upload proof → shipping order -->
          <Transition name="pop">
            <div v-if="pendingSelfOrder" class="max-w-sm mx-auto mt-5 bg-white border border-primary-200 rounded-2xl p-4 shadow-lg ring-1 ring-primary-100">
              <p class="text-sm font-bold text-gray-900 mb-0.5">Confirma tu pedido (lo compraste tú)</p>
              <p class="text-xs text-gray-500 mb-3">Sube tu comprobante para verificar la compra. Lo recibimos, importamos y entregamos. Sin comisión.</p>

              <div class="space-y-1.5 mb-3">
                <div v-for="(it, i) in pendingSelfOrder.items" :key="i" class="flex items-center gap-2 text-xs text-gray-700">
                  <img v-if="it.image" :src="it.image" class="w-9 h-9 rounded-lg object-cover border border-gray-200" />
                  <span class="flex-1 truncate">{{ it.title }}<span v-if="it.quantity > 1" class="text-gray-400"> ×{{ it.quantity }}</span></span>
                  <span v-if="it.price" class="shrink-0 font-semibold text-gray-500">${{ it.price }}</span>
                </div>
              </div>

              <label class="block text-xs font-semibold text-gray-700 mb-1">Dirección de entrega en México</label>
              <textarea v-model="selfOrder.address" rows="2" placeholder="Calle, colonia, ciudad, C.P." class="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"></textarea>

              <label class="block text-xs font-semibold text-gray-700 mb-1">Comprobante de compra (recibo o captura)</label>
              <input type="file" accept="image/*,application/pdf" @change="onSelfFile" class="w-full text-xs text-gray-600 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 file:text-xs file:font-semibold hover:file:bg-primary-100 mb-1" />
              <p v-if="selfOrder.file" class="text-[11px] text-emerald-600 truncate">✓ {{ selfOrder.file.name }}</p>

              <p v-if="selfOrderError" class="text-xs text-red-600 mt-2">{{ selfOrderError }}</p>
              <div class="flex items-center gap-2 mt-3">
                <button @click="cancelSelfOrder" :disabled="selfOrderLoading" class="px-3 py-2.5 text-gray-500 hover:bg-gray-100 text-sm font-semibold rounded-xl transition-all">Cancelar</button>
                <button @click="submitSelfOrder" :disabled="selfOrderLoading" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 active:scale-[.98] disabled:bg-gray-300 text-white text-sm font-bold rounded-xl transition-all">
                  {{ selfOrderLoading ? 'Creando pedido…' : 'Crear pedido' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <div class="bg-gradient-to-t from-gray-50 via-gray-50 to-transparent px-3 md:px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div class="max-w-2xl mx-auto">
            <AssistantComposer v-model:text="input" :mic-recording="micRecording" :mic-transcribing="micTranscribing" :mic-levels="micLevels" :mic-error="micError" :busy="isBusy" :placeholder="composerPlaceholder" @send="onComposerSend" @mic="toggleMic" />
          </div>
        </div>
      </template>
    </main>

    <!-- Full-screen product detail modal -->
    <ProductModal :product="selectedProduct" @close="selectedProduct = null" @assisted="onModalAssisted" />

    <!-- Shopping-profile (assistant memory): bottom sheet on mobile, centered
         dialog on desktop. Teleported to <body> so it's never clipped by the
         chat container's overflow/stacking context. -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div v-if="showMemory" class="fixed inset-0 z-[100] flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
          <div class="absolute inset-0 bg-black/50 md:backdrop-blur-sm" @click="closeMemory"></div>
          <Transition name="sheet" appear>
            <div v-if="showMemory" class="relative w-full md:w-auto md:max-w-lg md:mx-4 flex flex-col max-h-[92vh] md:max-h-[85vh]">
              <button @click="closeMemory" class="absolute -top-12 right-4 md:-top-3.5 md:-right-3.5 z-10 w-10 h-10 grid place-items-center rounded-full bg-white shadow-lg ring-1 ring-black/5 text-gray-600 hover:text-gray-900 active:scale-90 transition" aria-label="Cerrar">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              <div class="overflow-y-auto bg-white rounded-t-3xl md:rounded-3xl shadow-2xl pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-0 md:w-[32rem] max-w-full">
                <!-- grab handle (mobile only) -->
                <div class="md:hidden pt-3 pb-1 flex justify-center"><span class="w-10 h-1.5 rounded-full bg-gray-300"></span></div>
                <ShoppingProfileCard bare />
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'

// Auto-continue ONLY for the client-side create_account tool once it has a
// result. Server tools (search_products/browse_store/…) are fully resolved
// server-side; auto-sending after them re-runs the model and duplicates the
// reply (the "message sent twice" bug).
const CLIENT_TOOLS = new Set(['tool-create_account', 'tool-create_self_order', 'tool-cancel_order'])
function continueAfterAccount({ messages }) {
  const last = messages?.[messages.length - 1]
  if (!last || last.role !== 'assistant') return false
  // Resume the model exactly ONCE, right after a CLIENT-executed tool (account
  // creation or a self-purchase order) produced its result and the model hasn't
  // replied yet — i.e. that result is the LAST part. The continuation text gets
  // appended to this same message, so checking "any part" (instead of the last)
  // kept matching and auto-sent forever: stuck typing dots + runaway API calls.
  const lastPart = (last.parts || [])[(last.parts || []).length - 1]
  return !!lastPart && CLIENT_TOOLS.has(lastPart.type) && lastPart.state === 'output-available'
}

const props = defineProps({
  // When true (in-app page), go full-screen on mobile since the site navbar is
  // hidden there — the chat's own header is the single top bar.
  fullscreenMobile: { type: Boolean, default: false },
  // When true (public /search page), there is NO site navbar at all: take the
  // full viewport height, show the sidebar even for guests, and put the profile
  // (login/logout) in the sidebar's bottom-left (ChatGPT-style).
  standalone: { type: Boolean, default: false },
  // When true (logged-in dashboard /app), the assistant is the OS for ALL Boxly
  // pipelines: the empty state shows the four pipeline action cards (not shopping
  // starter cards) and the server gets surface:'hub' so it loads the OS router.
  hub: { type: Boolean, default: false },
})
const { fullscreenMobile, standalone, hub } = toRefs(props)

const { $customFetch } = useNuxtApp()
const user = useState('user')
// First name for the hub welcome header (falls back gracefully for guests).
const userName = computed(() => (user.value?.name || '').trim().split(/\s+/)[0] || '')

// Copy the US shipping address (casillero) so it's one tap to paste at checkout.
const addressCopied = ref(false)
async function copyUsAddress() {
  const text = `BOXLY ${user.value?.name || ''}\n157 Virginia Ave Suite 835\nSan Ysidro, CA 92173`
  try {
    await navigator.clipboard.writeText(text)
    addressCopied.value = true
    setTimeout(() => { addressCopied.value = false }, 2000)
  } catch { /* clipboard blocked — no-op */ }
}

// On the standalone page the sidebar shows for everyone (guests get an empty
// history + the login entry at the bottom); in-app it's authed-only.
// The conversations sidebar belongs to the CHAT (/app/search, standalone), NOT the
// dashboard lobby (hub) — the dashboard is a separate page now.
const showSidebar = computed(() => !hub.value && (standalone.value || !!user.value))

// Profile sign-out (sidebar widget) → drop the session and reload as a guest.
async function logout() {
  try { await $customFetch('/auth/logout', { method: 'POST' }) } catch { /* ignore */ }
  user.value = null
  const csrf = useCookie('XSRF-TOKEN'); csrf.value = null
  window.location.href = standalone.value ? '/search' : '/login'
}

// Reflect the active conversation in the URL as a QUERY param (?c=<id>) — NOT a
// path segment. A path change (/app/search → /app/search/<id>) remounts the page
// (which wiped the live chat mid-stream — the long bug). A query change does NOT
// remount. So refresh/deep-link loads the chat FROM THE SERVER, and sending never
// remounts.
const route = useRoute()
const router = useRouter()
function syncUrl(id) {
  const want = id != null ? String(id) : null
  // Treat an existing path id (old /app/search/<id> links) as already-reflected.
  const have = route.query.c != null ? String(route.query.c)
    : (route.params.id != null ? String(route.params.id) : null)
  if (want === have) return
  const q = { ...route.query }
  delete q.q // hero hand-off param — never keep it once a conversation is reflected
  if (want) q.c = want; else delete q.c
  router.replace({ query: q })
}

// Hand-off from the landing hero (or any deep link): /search?q=... auto-sends the
// query as the first message. Reuses pickSuggestion (token + conversation + send).
// Works for guests too. Guarded so it fires exactly once per mount (a guest fires
// it in setup for an instant first paint; authed fires it after the chat token is
// minted in initLoggedIn). URL cleanup is deferred so we never nest a navigation
// inside setup; the guard already prevents a resend before the URL settles.
let initialQuerySent = false
function sendInitialQuery() {
  if (initialQuerySent) return false
  const q = (route.query.q ?? '').toString().trim()
  if (!q) return false
  initialQuerySent = true
  pickSuggestion(q)
  nextTick(() => { const clean = { ...route.query }; delete clean.q; router.replace({ query: clean }) })
  return true
}

const token = ref(null)
const shoppingProfile = ref(null)
const conversations = ref([])
const activeId = ref(null)
const savedCount = ref(0)
const input = ref('')
// Hub OS: which pipeline the user is in (set by tapping an action card). Drives the
// composer placeholder and rides to the server as a one-turn routing hint. null = none.
const activePipeline = ref(null)
const scroller = ref(null)
const drawerOpen = ref(false)
// Desktop conversations sidebar — collapsed (icon rail) by default, ChatGPT-style.
// Remembers the user's choice across visits.
const SIDEBAR_KEY = 'boxly_assistant_sidebar_collapsed'
const sidebarCollapsed = ref(true)
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  try { localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed.value ? '1' : '0') } catch { /* ignore */ }
}
// Start in the loading state when the URL already points at a conversation, so a
// deep-link/refresh shows ONE loader from the first paint (no flash of the empty
// "new chat" screen before openChat kicks in).
const loadingChat = ref(!!(route.query.c || route.params.id))
const selectedProduct = ref(null)
const showMemory = ref(false)
// Reload the profile on close so edits made in the modal immediately flow into
// the assistant's personalization (system prompt + starter suggestions).
function closeMemory() { showMemory.value = false; loadProfile() }
let openSeq = 0
let hubPhraseTimer = null
onBeforeUnmount(() => { if (hubPhraseTimer) clearInterval(hubPhraseTimer) })
// In-memory cache of opened conversations (id -> { messages, oldestId, hasMore,
// products }) for instant re-open. Pagination state for the ACTIVE thread:
const msgCache = new Map()

// Single source of truth: every product shown in the active chat (deduped),
// so the assistant can re-display earlier items even after pagination.
const savedProducts = ref([])
// FNV-1a 32-bit → base36. MUST match ConversationController::productId (PHP).
function pid(raw) {
  const s = raw.url || raw.product_url || ((raw.title || '') + (raw.store || ''))
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  return 'p' + h.toString(36)
}
function registerProducts(list) {
  if (!Array.isArray(list) || !list.length) return
  const byId = new Map(savedProducts.value.map((p) => [p.id, p]))
  for (const raw of list) {
    const url = raw.url || raw.product_url || null
    const title = raw.title || raw.name || null
    if (!title && !url) continue
    const id = raw.id || pid({ url, title, store: raw.store })
    let img = raw.image || raw.image_url || null
    if (typeof img === 'string' && img.startsWith('data:')) img = null
    const prev = byId.get(id) || {}
    byId.set(id, {
      id, title, url,
      store: raw.store ?? prev.store ?? null,
      price: raw.price ?? raw.price_usd ?? prev.price ?? null,
      was: raw.was ?? prev.was ?? null,
      on_sale: raw.on_sale ?? raw.onSale ?? prev.on_sale ?? false,
      image: img || prev.image || null,
      snippet: raw.snippet ?? prev.snippet ?? null,
      token: raw.token ?? prev.token ?? null,
    })
  }
  savedProducts.value = [...byId.values()].slice(-80)
}
function registerFromMessages() {
  for (const m of chat.messages) {
    if (m.role !== 'assistant') continue
    for (const part of (m.parts || [])) {
      if (Array.isArray(part?.output?.products)) registerProducts(part.output.products)
    }
  }
}
const oldestLoadedId = ref(null)
const hasMoreOlder = ref(false)
const loadingOlder = ref(false)

const PAGE = 30
function mapMsg(m) {
  return {
    id: String(m.id),
    role: m.role,
    parts: (m.content && m.content.parts) || [{ type: 'text', text: typeof m.content === 'string' ? m.content : (m.content?.text || '') }],
  }
}

const { recording: micRecording, transcribing: micTranscribing, levels: micLevels, error: micError, toggle: micToggle } = useVoiceInput()

const retitled = ref(false)
const pendingAccount = ref(null)
const GUEST_RESUME_KEY = 'boxly_guest_resume'

// First-use soft conversion gate: the moment a GUEST's first reply with results
// lands, nudge them (once) to grab an account — same stash+resume as the hard
// purchase gate, so they pick right back up here, authenticated. Dismissible;
// never blocks. Shown at most once per guest (localStorage flag).
const softGate = ref(false)
const SOFTGATE_SEEN_KEY = 'boxly_guest_softgate_seen'
function dismissSoftGate() {
  softGate.value = false
  try { localStorage.setItem(SOFTGATE_SEEN_KEY, '1') } catch { /* ignore */ }
}
function maybeSoftGate() {
  if (softGate.value || user.value || pendingAccount.value) return // guests only, once, never over the hard gate
  try { if (localStorage.getItem(SOFTGATE_SEEN_KEY)) return } catch { /* ignore */ }
  // Only after at least one assistant reply that actually showed products.
  if (!chat.messages.some((m) => m.role === 'assistant' && hasProducts(m))) return
  softGate.value = true
}
// The hard purchase gate always wins — collapse the soft nudge if it appears.
watch(pendingAccount, (v) => { if (v) softGate.value = false })

// "Ya lo compré yo" → create a normal SHIPPING order (casillero). Client-side
// because the proof-of-purchase file lives in the browser. We confirm the
// delivery address (prefilled from their saved address) and upload the proof.
const pendingSelfOrder = ref(null) // { toolCallId, items: [{title,url,image,price,quantity,notes}] }
const selfOrder = reactive({ address: '', file: null })
// The most recent file the user attached in the composer — reused as the proof of
// purchase when a chat turn becomes a self-import order (set in onComposerSend).
const lastComposerFile = ref(null)
const selfOrderLoading = ref(false)
const selfOrderError = ref('')

// Build a one-line address from the saved profile address object
// ({street, exterior_number, colonia, municipio, estado, postal_code}).
function composeAddress(a) {
  if (!a) return ''
  const line1 = [a.street, a.exterior_number].filter(Boolean).join(' ')
  const parts = [
    line1,
    a.interior_number ? `Int. ${a.interior_number}` : null,
    a.colonia, a.municipio, a.estado, a.postal_code,
  ].filter(Boolean)
  return parts.join(', ')
}

function openSelfOrder(toolCall) {
  // Guests must authenticate first → show the gate (register OR login) and resume
  // on return; the self-order intent re-fires once they're signed in.
  if (!user.value) { pendingAccount.value = { toolCallId: toolCall.toolCallId }; return }
  const raw = (toolCall.input?.items) || []
  const items = raw.map((it) => {
    const saved = it.saved_id ? savedProducts.value.find((p) => p.id === it.saved_id) : null
    return {
      title: saved?.title || it.product_name || 'Producto',
      url: saved?.url || it.product_url || null,
      image: saved?.image || it.product_image_url || null,
      price: saved?.price ?? it.price ?? null,
      quantity: it.quantity || 1,
      notes: it.notes || null,
    }
  }).filter((it) => it.title || it.url)
  // Reuse the file the customer already dropped in chat (e.g. the receipt PDF the AI
  // just read) as the proof — no re-upload. They can still replace it in the form.
  selfOrder.file = lastComposerFile.value || null
  selfOrderError.value = ''
  pendingSelfOrder.value = { toolCallId: toolCall.toolCallId, items }
  // Prefill the delivery address from their saved profile (best-effort).
  $customFetch('/profile').then((res) => {
    selfOrder.address = composeAddress(res?.data?.address)
  }).catch(() => {})
}

function onSelfFile(e) {
  selfOrder.file = e.target.files?.[0] || null
}

async function submitSelfOrder() {
  selfOrderError.value = ''
  if (!selfOrder.address.trim()) { selfOrderError.value = 'Confirma tu dirección de entrega en México.'; return }
  if (!selfOrder.file) { selfOrderError.value = 'Sube tu comprobante de compra para verificar tu pedido.'; return }
  selfOrderLoading.value = true
  try {
    // 1) Create the shipping order (collecting status, full_address path).
    const ores = await $customFetch('/orders', {
      method: 'POST',
      body: { order_type: 'shipping', delivery_address: { full_address: selfOrder.address.trim() } },
    })
    // The create endpoint returns { data: { order: {...} } }.
    const order = ores?.data?.order || ores?.data || ores
    const orderId = order.id
    const orderNumber = order.order_number || null

    // 2) Add each item; attach the proof file to the first one (it's the
    //    receipt for the whole purchase). Uses multipart so the file uploads.
    const items = pendingSelfOrder.value.items
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      const fd = new FormData()
      fd.append('product_name', it.title)
      fd.append('quantity', String(it.quantity || 1))
      if (it.url) fd.append('product_url', it.url)
      if (it.image) fd.append('product_image_url', it.image)
      if (it.price && it.price > 0) fd.append('declared_value', String(it.price))
      if (i === 0) fd.append('proof_of_purchase', selfOrder.file)
      await $customFetch(`/orders/${orderId}/items`, { method: 'POST', body: fd })
    }

    const toolCallId = pendingSelfOrder.value.toolCallId
    // Compact item summary for the in-chat confirmation card (and for the model).
    const summary = items.map((it) => ({ title: it.title, quantity: it.quantity || 1, price: it.price ?? null }))
    pendingSelfOrder.value = null
    selfOrder.file = null
    lastComposerFile.value = null // consumed as this order's proof
    await chat.addToolResult({ tool: 'create_self_order', toolCallId, output: { success: true, order_number: orderNumber, items: summary, count: summary.length } })
    loadConversations().catch(() => {})
  } catch (e) {
    selfOrderError.value = e?.data?.message || 'No se pudo crear el pedido. Intenta de nuevo.'
  } finally {
    selfOrderLoading.value = false
  }
}

function cancelSelfOrder() {
  if (!pendingSelfOrder.value) return
  const toolCallId = pendingSelfOrder.value.toolCallId
  pendingSelfOrder.value = null
  selfOrder.file = null
  chat.addToolResult({ tool: 'create_self_order', toolCallId, output: { success: false, cancelled: true } })
}

// ── Phase 2: "Registrar compra" (casillero) receipt magic. The user uploads a
// receipt/confirmation → /api/extract-receipt reads it into line items → an EDITABLE
// preview card → confirm creates a shipping order with the receipt as proof. Fully
// client-driven (no chat round-trip for the extraction). ──────────────────────────
const receiptBusy = ref(false)        // extraction in flight
const receiptError = ref('')
const pendingReceipt = ref(null)      // { items, store, file }
const receiptLoading = ref(false)     // order creation in flight
const receiptSuccess = ref(null)      // { order_number }
const receiptAddress = ref('')        // delivery address (prefilled from profile)

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

async function onReceiptFile(file) {
  if (!file) return
  receiptError.value = ''
  receiptSuccess.value = null
  receiptBusy.value = true
  try {
    const dataUrl = await fileToDataUrl(file)
    const r = await $fetch('/api/extract-receipt', { method: 'POST', body: { image: dataUrl } })
    const items = Array.isArray(r?.items) && r.items.length ? r.items : [{ name: '', quantity: 1, price: 0 }]
    pendingReceipt.value = { items, store: r?.store || '', file }
    // Prefill the delivery address from the saved profile (best-effort).
    if (!receiptAddress.value) {
      $customFetch('/profile').then((res) => { receiptAddress.value = composeAddress(res?.data?.address) }).catch(() => {})
    }
  } catch (e) {
    console.error('receipt extract failed', e)
    // Still let them register manually with an empty editable card.
    pendingReceipt.value = { items: [{ name: '', quantity: 1, price: 0 }], store: '', file }
  } finally {
    receiptBusy.value = false
  }
}

function cancelReceipt() { pendingReceipt.value = null; receiptError.value = '' }

// ── Phase 3: cancel an order (client-executed tool → hard confirm gate). ──────────
const pendingCancel = ref(null)   // { toolCallId, order_id, order_number }
const cancelLoading = ref(false)
const cancelErrorMsg = ref('')
function openCancel(toolCall) {
  cancelErrorMsg.value = ''
  pendingCancel.value = {
    toolCallId: toolCall.toolCallId,
    order_id: toolCall.input?.order_id,
    order_number: toolCall.input?.order_number || toolCall.input?.order_id,
  }
}
async function submitCancel() {
  if (!pendingCancel.value) return
  cancelErrorMsg.value = ''
  cancelLoading.value = true
  const { toolCallId, order_id } = pendingCancel.value
  try {
    // The model usually passes the order_number ("26CSYRTR"), not the numeric id.
    // Resolve it to the real id first (a bare order_number would coerce to the
    // wrong numeric id server-side and 403). Route the DELETE by numeric id only.
    let id = order_id
    if (!/^\d+$/.test(String(order_id))) {
      const res = await $customFetch('/orders')
      const arr = res?.data?.data || res?.data || []
      const match = (Array.isArray(arr) ? arr : []).find((o) => String(o.order_number).toLowerCase() === String(order_id).toLowerCase())
      if (!match?.id) throw { data: { message: 'No encontré ese pedido.' } }
      id = match.id
    }
    await $customFetch(`/orders/${id}`, { method: 'DELETE' })
    pendingCancel.value = null
    await chat.addToolResult({ tool: 'cancel_order', toolCallId, output: { success: true } })
    loadConversations().catch(() => {})
  } catch (e) {
    cancelErrorMsg.value = e?.data?.message || 'No se pudo cancelar el pedido.'
  } finally {
    cancelLoading.value = false
  }
}
function dismissCancel() {
  if (!pendingCancel.value) return
  const toolCallId = pendingCancel.value.toolCallId
  pendingCancel.value = null
  chat.addToolResult({ tool: 'cancel_order', toolCallId, output: { success: false, cancelled: true } })
}

// ── Phase 4: in-person (Las Americas) planner → create PR + deposit checkout. ─────
const inPersonLoading = ref(false)
const inPersonError = ref('')
const inPersonResult = ref(null)   // { checkoutUrl, requestNumber, deposit }
async function submitInPerson(sel) {
  inPersonError.value = ''
  inPersonLoading.value = true
  try {
    const res = await $customFetch('/purchase-requests/in-person', { method: 'POST', body: sel })
    const data = res?.data || res
    const pr = data?.purchase_request || data
    inPersonResult.value = {
      checkoutUrl: data?.checkout_url || res?.checkout_url || pr?.payment_link || '',
      requestNumber: pr?.request_number || '',
      deposit: pr?.deposit_amount_usd ?? data?.deposit_amount_usd ?? null,
    }
    loadConversations().catch(() => {})
    scrollDown()
  } catch (e) {
    inPersonError.value = e?.data?.message || 'No se pudo crear la solicitud. Intenta de nuevo.'
  } finally {
    inPersonLoading.value = false
  }
}

// Create a shipping (casillero) order from arbitrary items + the receipt as proof.
// Items are created WITHOUT the proof file (the item-store endpoint wraps the item
// insert + proof upload in one DB transaction, so a storage hiccup would roll back
// the item). We attach the receipt to the first item best-effort AFTERWARDS, so the
// order + items always persist even if the proof upload fails.
async function createShippingOrder(items, address, proofFile) {
  const ores = await $customFetch('/orders', {
    method: 'POST',
    body: { order_type: 'shipping', delivery_address: { full_address: address } },
  })
  // The create endpoint returns { data: { order: {...} } }.
  const order = ores?.data?.order || ores?.data || ores
  const orderId = order.id
  let firstItemId = null
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    const fd = new FormData()
    fd.append('product_name', it.name)
    fd.append('quantity', String(it.quantity || 1))
    if (it.price && it.price > 0) fd.append('declared_value', String(it.price))
    const res = await $customFetch(`/orders/${orderId}/items`, { method: 'POST', body: fd })
    const item = res?.data?.item || res?.data || res
    if (i === 0) firstItemId = item?.id
  }
  // Best-effort: attach the receipt as proof to the first item (never fails the order).
  if (proofFile && firstItemId) {
    try {
      const fd = new FormData()
      fd.append('_method', 'PUT')
      fd.append('proof_of_purchase', proofFile)
      await $customFetch(`/orders/${orderId}/items/${firstItemId}`, { method: 'POST', body: fd })
    } catch (e) { console.warn('proof attach skipped', e) }
  }
  return order.order_number || null
}

async function submitReceipt({ items, address }) {
  receiptError.value = ''
  if (!items.length) { receiptError.value = 'Agrega al menos un producto.'; return }
  if (!address || !address.trim()) { receiptError.value = 'Confirma tu dirección de entrega en México.'; return }
  receiptLoading.value = true
  try {
    const orderNumber = await createShippingOrder(items, address.trim(), pendingReceipt.value?.file)
    receiptSuccess.value = { order_number: orderNumber }
    pendingReceipt.value = null
    loadConversations().catch(() => {})
  } catch (e) {
    receiptError.value = e?.data?.message || 'No se pudo crear el pedido. Intenta de nuevo.'
  } finally {
    receiptLoading.value = false
  }
}

// ChatGPT-style picture cards — ENTIRELY admin-managed. Whatever active starter
// prompts exist in the backend is exactly what shows (no hardcoded defaults, no
// personalized injections). No cards created → no cards shown.
// `grad` is the card background; `img` is an uploaded photo that wins over the
// `imgq` product-photo lookup; `imgq` resolves a representative photo otherwise.
const GRAD_PALETTE = ['from-fuchsia-500 to-purple-800', 'from-emerald-500 to-teal-800', 'from-sky-500 to-indigo-800', 'from-orange-500 to-rose-800']
const serverPrompts = ref([])
async function loadStarterPrompts() {
  try {
    const rows = (await $customFetch('/starter-prompts'))?.data
    serverPrompts.value = (Array.isArray(rows) ? rows : []).map((r, i) => ({
      emoji: r.emoji || '🛍️',
      text: r.prompt_text,
      title: r.title,
      grad: GRAD_PALETTE[i % GRAD_PALETTE.length],
      imgq: r.image_query || '',
      img: r.image_url || null,
    }))
  } catch { serverPrompts.value = [] }
}
const suggestions = computed(() => serverPrompts.value)

// --- Card images: resolve a representative product photo per card, cached in
//     localStorage so each query is fetched at most once per browser. ---
const cardImages = ref({})  // imgq -> url ('' = fetched, none found)
const fetchingImg = new Set()
const CARD_IMG_KEY = 'boxly_card_images'
function loadCardImageCache() {
  try { const raw = localStorage.getItem(CARD_IMG_KEY); if (raw) cardImages.value = JSON.parse(raw) || {} } catch { /* ignore */ }
}
// Persist ONLY successful URLs — failures/'' stay in-memory for the session so a
// transient miss or a dead image URL refetches on the next load.
function saveCardImageCache() {
  try {
    const ok = Object.fromEntries(Object.entries(cardImages.value).filter(([, v]) => v))
    localStorage.setItem(CARD_IMG_KEY, JSON.stringify(ok))
  } catch { /* ignore */ }
}
function cardImg(s) { return s?.img || cardImages.value[s?.imgq] || null }
function onCardImgError(s) { if (s?.imgq) { cardImages.value = { ...cardImages.value, [s.imgq]: '' }; saveCardImageCache() } }

// The starter cards stay hidden behind a single centered loader until ALL their
// images are resolved AND decoded — so the whole grid paints at once instead of
// flashing emoji placeholders and popping images in one by one.
const cardsReady = ref(false)
// Resolve once the browser has actually fetched+decoded each URL (or failed).
function preloadImages(urls) {
  return Promise.all((urls || []).map((u) => new Promise((resolve) => {
    const img = new Image()
    img.referrerPolicy = 'no-referrer'
    img.onload = img.onerror = () => resolve()
    img.src = u
  })))
}
// Full first-paint pipeline: load admin cards → resolve a photo per card →
// preload them → reveal everything together.
async function prepareStarterCards() {
  await loadStarterPrompts()
  await ensureCardImages(suggestions.value)
  await preloadImages(suggestions.value.map(cardImg).filter(Boolean))
  cardsReady.value = true
}
async function ensureCardImages(list) {
  for (const s of list || []) {
    const q = s?.imgq
    if (!q || cardImages.value[q] !== undefined || fetchingImg.has(q)) continue
    fetchingImg.add(q)
    try {
      const r = await $fetch('/api/card-image', { params: { q } })
      cardImages.value = { ...cardImages.value, [q]: r?.image || '' }
      saveCardImageCache()
    } catch {
      cardImages.value = { ...cardImages.value, [q]: '' }
    } finally {
      fetchingImg.delete(q)
    }
  }
}

const isBusy = computed(() => chat.status === 'streaming' || chat.status === 'submitted')
const GALLERY_TOOLS = ['tool-show_products', 'tool-browse_store', 'tool-browse_stores', 'tool-search_products', 'tool-show_saved_products']
function isGalleryTool(part) { return GALLERY_TOOLS.includes(part?.type) }
// Merge ALL text parts of a message into one string so a multi-step reply renders
// in ONE bubble instead of fragmenting into many (the "split bubbles" bug).
function msgText(m) { return (m.parts || []).filter((p) => p.type === 'text' && p.text).map((p) => p.text).join('\n\n') }
// Did ANY gallery tool in this message return products? Used to suppress a stray
// "no results" message when another search in the same turn did find options.
function hasProducts(m) { return (m.parts || []).some((p) => isGalleryTool(p) && p.state === 'output-available' && p.output?.products?.length) }
// Show the "no results" line ONLY once the turn has fully settled — never while the
// current message is still streaming (a second search may still be loading), which
// caused a false "no encontré opciones" to flash before the real results arrived.
function showNoResults(m, part) {
  if (!isGalleryTool(part) || part.state !== 'output-available' || hasProducts(m)) return false
  const isCurrent = m.id === chat.messages[chat.messages.length - 1]?.id
  return !(isBusy.value && isCurrent)
}
// Tool calls that render their OWN in-place loader (spinner/SearchLoader) while
// running — for these we don't also show the bottom dots (that'd double up).
const TOOLS_WITH_LOADER = new Set([
  'tool-search_products', 'tool-browse_store', 'tool-browse_stores',
  'tool-web_search', 'tool-show_orders', 'tool-plan_in_person',
])
// Keep a loading indicator visible WHENEVER the assistant is working, so the chat
// never goes blank between steps (the "did my click do anything?" confusion). Hide
// the dots only when the reply is actively streaming TEXT or a tool is showing its
// own loader — in every other busy moment (user just sent, between tool steps, a
// tool without its own loader running) the bottom dots fill the gap.
const showTyping = computed(() => {
  if (!isBusy.value) return false
  const last = chat.messages[chat.messages.length - 1]
  if (last?.role !== 'assistant') return true // user just sent — assistant forming
  const parts = last.parts || []
  const lastPart = parts[parts.length - 1]
  if (lastPart?.type === 'text' && lastPart.text) return false // streaming text is the indicator
  const loadingWithOwnUi =
    lastPart && String(lastPart.type).startsWith('tool-') &&
    lastPart.state !== 'output-available' && lastPart.state !== 'output-error' &&
    TOOLS_WITH_LOADER.has(lastPart.type)
  return !loadingWithOwnUi
})
const activeTitle = computed(() => conversations.value.find((c) => c.id === activeId.value)?.title || 'Asistente')

const chat = new Chat({
  transport: new DefaultChatTransport({
    api: '/api/assistant',
    prepareSendMessagesRequest({ messages }) {
      return { body: {
        messages,
        token: token.value,
        // Links each search/question logged this turn to THIS chat, so admins can
        // open the full thread from the AI-search view. Set before send on turn 1.
        conversationId: activeId.value || undefined,
        shoppingProfile: shoppingProfile.value,
        savedProducts: savedProducts.value,
        // Hub surface → server loads the OS router (all pipelines). `pipeline` is the
        // action card the user last tapped, a routing hint consumed for one turn.
        ...(hub.value ? { surface: 'hub', pipeline: activePipeline.value || undefined } : {}),
      } }
    },
  }),
  sendAutomaticallyWhen: continueAfterAccount,
  onToolCall({ toolCall }) {
    if (toolCall.toolName === 'create_account') {
      // Guest hit the purchase gate → show a button that sends them to register
      // (and resumes this chat on return). No inline form; the register page
      // collects details and supports Google sign-in.
      pendingAccount.value = { toolCallId: toolCall.toolCallId }
    } else if (toolCall.toolName === 'create_self_order') {
      openSelfOrder(toolCall)
    } else if (toolCall.toolName === 'cancel_order') {
      openCancel(toolCall)
    }
  },
  // Surface failures instead of a silent dead-end (e.g. a model that rejects an
  // attachment). Without this the user just sees nothing come back.
  onError(err) {
    console.error('assistant chat error', err)
    chatError.value = 'Algo salió mal al enviar tu mensaje. Intenta de nuevo.'
  },
})
const chatError = ref('')

// INSTANT first paint for the landing-hero hand-off: a GUEST arriving with ?q=...
// fires it synchronously HERE in setup (not onMounted), so the very first render
// already shows their message bubble + typing dots — no starter-cards flash, no
// wait. Guests need no chat token, so there's nothing to wait for. Authed users
// go through initLoggedIn instead (their token must be minted before sending).
if (import.meta.client && !user.value) sendInitialQuery()

// Warm the Nitro server function the moment the chat mounts (direct /search loads
// don't come through the hero's warm-up), so the first /api/assistant call skips
// the serverless cold start. Cheap, fire-and-forget, client-only.
if (import.meta.client) $fetch('/api/ping').catch(() => {})

// Init on the client once the user is known. Load history + profile in PARALLEL
// so the sidebar shows fast; the chat token is only needed to SEND (authed
// tools), so it's minted in the background, off the load path.
let inited = false
onMounted(() => {
  watch(user, (u) => { if (u && !inited) initLoggedIn() }, { immediate: true })
  // Guest entry points (logged-in users go through initLoggedIn):
  //  1) arrived from the landing hero with ?q=... → already fired in setup, or
  //  2) bounced to /register and hit BACK (no account yet) → restore their chat.
  if (!user.value && !initialQuerySent && !sendInitialQuery()) maybeRestoreGuestChat()
  // Reflect the active chat in the URL as ?c=<id> (query, no remount).
  watch(activeId, (id) => syncUrl(id))
  // Resolve a real product photo for each starter card (cached in localStorage).
  loadCardImageCache()
  // Prepare ALL starter cards + images, then reveal them at once (centered loader
  // until ready — no emoji-then-image pop-in). Never block longer than 6s on the
  // image prefetch in case a lookup is slow/unreachable.
  prepareStarterCards()
  setTimeout(() => { cardsReady.value = true }, 6000)
  // Hub: rotate the inviting placeholder + detect an in-progress shipment.
  if (hub.value) {
    if (user.value) loadOpenOrder()
    else watch(user, (u) => { if (u) loadOpenOrder() })
    // Let the page breathe (~1.2s) before the placeholder starts rotating — calm,
    // "ready when you are", never demanding.
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!reduce) setTimeout(() => {
      hubPhraseTimer = setInterval(() => {
        if (!input.value && !activePipeline.value && !hoverCardKey.value) hubPhraseIdx.value = (hubPhraseIdx.value + 1) % HUB_PHRASES.length
      }, 3200)
    }, 1200)
  }
  // After the first reveal, keep filling images if the personalized set changes.
  watch(suggestions, (list) => { if (cardsReady.value) ensureCardImages(list) })
  // Restore the saved sidebar collapsed/expanded preference (default collapsed).
  // On the public /search page always start CLOSED (landing-style) — don't reopen
  // from a stored preference.
  if (!standalone.value) {
    try { const v = localStorage.getItem(SIDEBAR_KEY); if (v !== null) sidebarCollapsed.value = v === '1' } catch { /* ignore */ }
  }
})

async function initLoggedIn() {
  if (inited) return
  inited = true
  await Promise.all([loadConversations(), loadProfile()])
  ensureChatToken()
  // Just came back from register/Google sign-in mid-purchase? Restore + continue.
  if (await maybeResumeGuest()) return
  // Arrived from the landing hero with ?q=... → fire that search as the first message.
  if (sendInitialQuery()) return
  // Refresh / deep-link: load the conversation named in the URL FROM THE SERVER.
  // Accept ?c=<id> (new) or an old /app/search/<id> path id.
  const cid = route.query.c || route.params.id
  if (cid) openChat(cid)
}

async function loadProfile() {
  try { shoppingProfile.value = (await $customFetch('/me/shopping-profile')).data } catch {}
}

// Mint the chat token once (background). Distinct from the MCP token so it never
// clobbers the user's Claude Desktop connection.
let tokenPromise = null
function ensureChatToken() {
  // Guests have no session — minting a chat token would 401 and the global
  // $fetch plugin would bounce them to /login. They don't need a token until
  // they're signed in (resume mints it on return). So skip for guests.
  if (!user.value || token.value) return
  if (!tokenPromise) {
    tokenPromise = $customFetch('/me/chat-token', { method: 'POST' })
      .then((r) => { token.value = r.token })
      .catch((e) => { console.error('chat token failed', e); tokenPromise = null })
  }
  return tokenPromise
}

// Create the thread the instant the user sends their first message (like
// ChatGPT) — it shows in the sidebar immediately, before the AI even responds.
// SINGLE, GUARDED creator: a send and the background persist() can both ask for a
// conversation at once; without this guard they each POST one, producing a
// duplicate sidebar entry whose id ≠ the chat we're viewing (the "empty chat on
// the side" bug). Concurrent callers share one in-flight promise; once activeId is
// set, later calls are no-ops.
let convPromise = null
function ensureConversation(firstText) {
  if (!user.value) return Promise.resolve(null)
  if (activeId.value) return Promise.resolve(activeId.value)
  if (convPromise) return convPromise
  const title = (firstText || '').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Nuevo chat'
  convPromise = $customFetch('/conversations', { method: 'POST', body: { title } })
    .then((r) => {
      const c = r.data
      activeId.value = c.id
      conversations.value = [c, ...conversations.value.filter((x) => x.id !== c.id)]
      return c.id
    })
    .catch((e) => { console.error('create conversation failed', e); return null })
    .finally(() => { convPromise = null })
  return convPromise
}

async function loadConversations() {
  try { conversations.value = (await $customFetch('/conversations')).data } catch {}
}

async function onComposerSend({ files } = {}) {
  const text = input.value.trim()
  if (isBusy.value) return
  if (!text && !(files && files.length)) return
  input.value = ''
  chatError.value = ''
  // Remember the attached file (receipt/photo): if the AI turns this into a
  // self-import order, we reuse it as the proof of purchase so the customer never
  // re-uploads what they already dropped in chat. Persists across follow-up turns
  // (attach receipt → "what did I buy?" → "register it") until an order is created.
  if (files && files.length) lastComposerFile.value = files[0]
  await ensureChatToken() // authed tools need the token ready on the FIRST send
  await ensureConversation(text) // await so the conversation id rides on turn 1 (analytics linking)
  chat.sendMessage({ text: text || undefined, files: files || undefined })
  clearPipeline() // the routing hint was for this turn only
  scrollDown()
}
// ── Hub OS pipelines — the four action cards on the logged-in dashboard. Tapping a
// card is a CONVERSATION STARTER: it sets the active pipeline (routing hint + composer
// placeholder) and, where there's an instant entry widget (upload/orders), renders it
// client-side; the AI is only called once the user provides input. ───────────────────
// The lobby: three cards = the three reasons a customer walks in. "Comprar" is the
// hero (dominant). Each primes its workflow (placeholder + routing hint) and hovering
// previews the AI's next question; the AI powers it all.
const PIPELINES = [
  { key: 'search',   hero: true, title: 'Todo EE.UU. Ahora en México.', sub: 'Pega un link o busca cualquier producto.', icon: 'bag', accent: 'sparkle', pills: ['Sin VPN', 'Sin tarjeta USA', 'Entrega en México'], placeholder: 'Busca un producto o pega un link…', hoverPlaceholder: '¿Qué producto estás buscando?' },
  { key: 'register', title: 'Ya lo compré', sub: 'Crea tu envío con lo que ya compraste', icon: 'box', accent: 'plus', value: 'Listo en segundos', vicon: 'bolt', placeholder: 'Cuéntame qué compraste (o sube tu recibo)…', hoverPlaceholder: 'Cuéntame qué compraste…' },
  { key: 'status',   title: 'Mi envío', sub: 'Consulta tu envío en tiempo real', icon: 'plane', value: 'En vivo', live: true, act: 'track', hoverPlaceholder: '¿Dónde está tu envío?' },
]
const heroCard = computed(() => PIPELINES[0])
const subCards = computed(() => PIPELINES.slice(1))
// The stores customers already know — an endless, slow carousel that subconsciously
// says "if it's sold in the U.S., Boxly can get it." Ordered by RECOGNITION (not
// alphabetized) so the first names instantly communicate scale. Typography only.
const STORE_LIST = ['Amazon', 'Costco', 'Target', 'Walmart', 'Nike', 'Apple', 'Home Depot', 'Best Buy', 'Sephora', 'Ross', 'TJ Maxx', 'Burlington', "Macy's", 'Coach', 'Michael Kors', "Levi's", 'Gap', 'Old Navy', 'Columbia', 'New Balance', 'Crocs', 'LEGO', 'Pokémon Center', 'Bath & Body Works', "Victoria's Secret", "Dick's Sporting Goods", 'y miles más']
// Duplicated so the CSS marquee loops seamlessly (translateX -50%).
const marqueeStores = [...STORE_LIST, ...STORE_LIST]
// Clickable pills under the input (Perplexity-style) — each immediately primes an
// action; hovering previews the AI's next question. Icons = Boxly's language.
const QUICK_PILLS = [
  { icon: 'search', label: 'Buscar producto', hover: '¿Qué producto estás buscando?', run: () => pickPipeline('search') },
  { icon: 'link', label: 'Pegar link', hover: 'Pega un link de Amazon.', run: () => pickPipeline('search') },
  { icon: 'box', label: 'Crear envío', hover: 'Cuéntame qué compraste…', run: () => pickPipeline('register') },
  { icon: 'plane', label: 'Mi envío', hover: '¿Dónde está tu envío?', run: () => pickSuggestion('¿Dónde está mi envío? Muéstrame mis pedidos') },
]
// Single-path outline icons (heroicons-style).
const ICONS = {
  receipt: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  bag: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1.2 11a1 1 0 01-1 1.1H4.8a1 1 0 01-1-1.1L5 9z',
  chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 01-9 9 8.96 8.96 0 01-4.28-1.09L3 21l1.09-4.72A8.96 8.96 0 013 12a9 9 0 019-9 9 9 0 019 9z',
  search: 'M10 17a7 7 0 100-14 7 7 0 000 14zM21 21l-4.3-4.3',
  link: 'M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 11-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 115.656 5.656l-1.5 1.5',
  truck: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 011-1h2.586a1 1 0 00.707-.293l3.414-3.414a1 1 0 00.293-.707V13a1 1 0 00-1-1h-6m-2 4h6m-6 0a2 2 0 11-4 0 2 2 0 014 0zm13 0a2 2 0 11-4 0 2 2 0 014 0z',
  // value-line icons
  bolt: 'M13 10V3L4 14h7v7l9-11h-7z',
  globe: 'M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18',
  card: 'M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z',
  pin: 'M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
  // discovery-journey icons
  flame: 'M12 3c0 4-4 5-4 9a4 4 0 108 0c0-2-1-3-1-3 2 1 3 3 3 5a6 6 0 11-12 0c0-5 6-7 6-11z',
  store: 'M3 9l1-5h16l1 5M4 9v10a1 1 0 001 1h14a1 1 0 001-1V9M4 9h16M9 20v-6h6v6',
  heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  drop: 'M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6',
  target: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 6a3 3 0 100 6 3 3 0 000-6z',
  cart: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 3h11m-8 3a1 1 0 11-2 0 1 1 0 012 0zm9 0a1 1 0 11-2 0 1 1 0 012 0z',
  plane: 'M6 12L3.27 3.13A59.77 59.77 0 0121.49 12 59.77 59.77 0 013.27 20.87L6 12zm0 0h7.5',
  box: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
}
const activePipelineMeta = computed(() => PIPELINES.find((p) => p.key === activePipeline.value) || null)
// The AI cursor invites action — the placeholder rotates through real examples,
// teaching the whole product without explaining it.
const HUB_PHRASES = [
  'Dile a Boxly qué necesitas.',
  '¿Qué producto estás buscando?',
  'Pega un link de Amazon.',
  'Vi esto en TikTok 👀',
  'Quiero crear mi envío.',
  'Necesito que Boxly compre esto.',
  '¿Dónde está mi envío?',
]
const hubPhraseIdx = ref(0)
// WOW: hovering a card or chip previews the AI's next question in the input.
const hoverCardKey = ref(null)
const hoverText = ref(null) // set by chip hover
// The composer placeholder: active pipeline > hovered chip/card preview > rotating phrase.
const composerPlaceholder = computed(() => {
  if (activePipelineMeta.value) return activePipelineMeta.value.placeholder
  if (hoverText.value) return hoverText.value
  const hovered = PIPELINES.find((p) => p.key === hoverCardKey.value)
  if (hovered) return hovered.hoverPlaceholder || hovered.placeholder
  if (hub.value) return HUB_PHRASES[hubPhraseIdx.value]
  return 'Escribe o pega un link…'
})
// Tapping an action card: set the pipeline, prime the composer, focus it. Entry
// widgets for register/status are rendered by later phases; here we prime + focus.
function pickPipeline(key) {
  activePipeline.value = key
  nextTick(() => composerRef.value?.focus())
}
// Clear the active pipeline once the user actually sends (it was a one-turn hint).
function clearPipeline() { activePipeline.value = null }

// ── "Para ti" — intent cards that answer "why open Boxly today?". Each STARTS A
// CONVERSATION (not a static product), mixing live signals (an open shipment, your
// last chat, your favorite stores) with evergreen shopping hooks. ─────────────────
const openOrder = ref(null) // an in-progress shipment WITH items → "Tu envío actual"
async function loadOpenOrder() {
  try {
    const res = await $customFetch('/orders')
    const arr = res?.data?.data || res?.data || []
    // Only surface a shipment that actually has products in it (an empty order
    // isn't a "current shipment" worth showing).
    openOrder.value = (Array.isArray(arr) ? arr : [])
      .find((o) => ['collecting', 'awaiting_packages'].includes(o.status) && (Array.isArray(o.items) ? o.items.length : 0) > 0) || null
  } catch { /* ignore */ }
}
// The live shipment summary — the page's biggest retention hook (a reason to come
// back and keep adding before it ships).
const currentShipment = computed(() => {
  const o = openOrder.value
  if (!o) return null
  const items = Array.isArray(o.items) ? o.items : []
  const count = items.reduce((s, it) => s + (Number(it.quantity) || 1), 0)
  let ship = null
  if (o.planned_ship_date) { try { ship = new Intl.DateTimeFormat('es-MX', { weekday: 'long' }).format(new Date(String(o.planned_ship_date).slice(0, 10) + 'T12:00:00')) } catch { /* ignore */ } }
  // Rough visual fill — a typical consolidated box holds ~15 items; keep room visible.
  const fill = Math.max(8, Math.min(92, Math.round((count / 15) * 100)))
  // "Leaving soon" (≤3 days) → auto-expand the widget so it gets attention.
  let soon = false
  if (o.planned_ship_date) {
    try { const d = new Date(String(o.planned_ship_date).slice(0, 10) + 'T12:00:00'); soon = (d.getTime() - Date.now()) / 86400000 <= 3 } catch { /* ignore */ }
  }
  return { id: o.id, order_number: o.order_number, count, ship, fill, soon }
})
// Shipment widget is collapsed by default; auto-expands only when it's leaving soon.
const shipmentExpanded = ref(false)
watch(currentShipment, (s, prev) => { if (s && !prev) shipmentExpanded.value = !!s.soon }, { immediate: true })
// Card click: "Mi envío" answers instantly (the concierge already knows the
// shipment); the others prime their workflow in the composer.
function selectCard(p) {
  if (p.act === 'track') return pickSuggestion('¿Dónde está mi envío? Muéstrame mis pedidos')
  pickPipeline(p.key)
}
// Clicking the hero card STARTS the concierge — it greets and asks what you want.
function heroStart() {
  activePipeline.value = 'search'
  pickSuggestion('Quiero comprar algo de Estados Unidos')
}

// Tapping a suggestion card sends the prompt right away (no edit step).
const composerRef = ref(null)
async function pickSuggestion(text) {
  if (isBusy.value || !text) return
  input.value = ''
  await ensureChatToken() // ensure the authed tools (orders, PRs) have a token on the FIRST send
  await ensureConversation(text) // await so the conversation id rides on turn 1 (analytics linking)
  chat.sendMessage({ text })
  clearPipeline()
  scrollDown()
}
// Tapping a follow-up chip (cross-sell) sends it as the next shopper message.
function sendFollowup(text) {
  if (isBusy.value || !text) return
  ensureChatToken()
  ensureConversation(text)
  chat.sendMessage({ text })
  scrollDown()
}

// When the user taps "Pedir con Boxly"/"Agregar al pedido" while the assistant
// is still streaming its follow-up text (common on desktop — mouse clicks land
// faster than the stream finishes), we can't send mid-stream. Queue it and flush
// the instant the chat is ready, so the button never silently does nothing.
const pendingPick = ref(null) // { p, assisted } queued while the assistant streams
// Build the price/url tail shared by both flows, stating the EXACT price the
// customer saw (the sale price if on sale) so the AI records that, not a
// re-extracted one. Google Shopping links aren't buyable — omit so the AI
// resolves the real page; pass real merchant URLs through.
function productTail(p) {
  const store = p.store ? ` de ${p.store}` : ''
  const onSale = p.onSale && p.was
  const price = p.price ? ` — precio $${p.price} USD${onSale ? ` (EN OFERTA, antes $${p.was})` : ''}` : ''
  const isGoogle = (p.url || '').includes('google.com/search')
  const urlPart = p.url && !isGoogle ? ` — ${p.url}` : ''
  return { store, price, urlPart }
}
// "Boxly lo compra" — assisted purchase → the AI creates a Purchase Request (+10%).
function onAssistedProduct(p) {
  ensureChatToken()
  if (isBusy.value) { pendingPick.value = { p, assisted: true }; return }
  const { store, price, urlPart } = productTail(p)
  const text = `Quiero que Boxly lo compre por mí (compra asistida): ${p.title}${store}${price}${urlPart}`
  ensureConversation(text)
  chat.sendMessage({ text })
  scrollDown()
}
// Gallery "Pedir" — add to the consolidated shipment/order (self-import flow).
function onPickProduct(p) {
  ensureChatToken()
  if (isBusy.value) { pendingPick.value = { p, assisted: false }; return }
  const { store, price, urlPart } = productTail(p)
  const text = `Agrégalo a mi envío: ${p.title}${store}${price}${urlPart}`
  ensureConversation(text)
  chat.sendMessage({ text })
  scrollDown()
}

// "Preguntar 💬" on a card — keep the conversation alive by asking the assistant
// about that specific product (it can see it in the chat's product registry).
function onAskProduct(p) {
  if (isBusy.value) return
  const store = p.store ? ` de ${p.store}` : ''
  const text = `Cuéntame más sobre esta opción: ${p.title}${store}`
  ensureConversation(text)
  chat.sendMessage({ text })
  scrollDown()
}

// Shipment card actions — finalize the consolidated order, or keep adding.
function onFinalizeShipment() {
  if (isBusy.value) return
  ensureChatToken()
  const text = 'Confirmar mi envío'
  ensureConversation(text)
  chat.sendMessage({ text })
  scrollDown()
}
function onAddMore() {
  if (isBusy.value) return
  const text = 'Quiero agregar algo más a mi envío'
  ensureConversation(text)
  chat.sendMessage({ text })
  scrollDown()
}

// Tapping an order row in the list → ask the assistant to open that order's
// status timeline (keeps the AI in the loop; it calls show_orders(order_id)).
function trackOrder(ord) {
  if (isBusy.value || !ord) return
  const text = `Muéstrame el estado de mi pedido ${ord.order_number || ord.id}`
  ensureConversation(text)
  chat.sendMessage({ text })
  scrollDown()
}

// Assisted-purchase summary card → Continue creates the request (AI has the items
// in context). Edit just returns focus to the composer to tweak.
function confirmAssisted() {
  if (isBusy.value) return
  const text = 'Sí, crea mi solicitud de compra asistida con eso.'
  ensureChatToken()
  ensureConversation(text)
  chat.sendMessage({ text })
  scrollDown()
}
function editAssisted() { composerRef.value?.focus() }

function openProduct(p) { selectedProduct.value = p }
function onModalAssisted(p) { selectedProduct.value = null; onAssistedProduct(p) }

async function toggleMic() {
  const text = await micToggle()
  if (text) input.value = (input.value ? input.value.trim() + ' ' : '') + text
}

// Guest purchase gate → send them to authenticate, then resume THIS chat when
// they come back. Works for BOTH register and login (many customers already have
// an account but start as guests), and for email AND Google sign-in: the stash is
// in localStorage and both auth pages honor ?redirect (Google packs it into the
// OAuth state). On return, maybeResumeGuest restores + claims + continues.
function stashGuestChat() {
  // The last thing the guest asked for = the intent to pick back up on return.
  let intent = ''
  for (let i = chat.messages.length - 1; i >= 0; i--) {
    if (chat.messages[i].role === 'user') {
      intent = (chat.messages[i].parts || []).filter((p) => p.type === 'text').map((p) => p.text).join(' ')
      break
    }
  }
  intent = intent.replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim()
  const messages = chat.messages.map((m) => ({ role: m.role, content: { parts: cleanParts(m.parts) } }))
  try { localStorage.setItem(GUEST_RESUME_KEY, JSON.stringify({ messages, intent, ts: Date.now() })) } catch { /* ignore */ }
  pendingAccount.value = null
}
const RESUME_REDIRECT = encodeURIComponent('/search?resume=1')
function goRegister() { stashGuestChat(); navigateTo(`/register?redirect=${RESUME_REDIRECT}`) }
function goLogin() { stashGuestChat(); navigateTo(`/login?redirect=${RESUME_REDIRECT}`) }

// On return from register/Google sign-in: if a fresh guest stash exists, restore
// the conversation, claim it under the new account, and continue the purchase.
async function maybeResumeGuest() {
  let stash = null
  try { stash = JSON.parse(localStorage.getItem(GUEST_RESUME_KEY) || 'null') } catch { /* ignore */ }
  if (!stash || !Array.isArray(stash.messages) || !stash.messages.length) return false
  localStorage.removeItem(GUEST_RESUME_KEY)
  if (Date.now() - (stash.ts || 0) > 30 * 60 * 1000) return false // too old — don't surprise them
  // Restore the chat history into the live chat.
  chat.messages = stash.messages.map((m, i) => ({ id: 'r' + i, role: m.role, parts: (m.content && m.content.parts) || [] }))
  registerFromMessages() // rebuild the in-chat product registry so the PR can bind the saved product
  // Migrate the conversation under the now-authenticated account.
  try {
    const c = await $customFetch('/conversations/claim', { method: 'POST', body: { messages: stash.messages } })
    activeId.value = c.data.id
    savedCount.value = chat.messages.length
    await loadConversations()
  } catch (e) { console.error('resume claim failed', e) }
  scrollDown()
  // Continue where they left off (token is minted by initLoggedIn).
  await ensureChatToken()
  chat.sendMessage({ text: `Ya creé mi cuenta ✅ ${stash.intent || 'Continuemos con el pedido.'}`.trim() })
  scrollDown()
  return true
}

// Guest tapped "create account", landed on /register, then hit BACK without
// signing up. They're STILL a guest (initLoggedIn / maybeResumeGuest never run),
// so rehydrate their chat from the gate stash here so they don't lose it. Purely
// visual — no claim, no token, no auto-message. The stash is LEFT in place: if
// they later go register, maybeResumeGuest() restores + claims + continues it.
function maybeRestoreGuestChat() {
  if (chat.messages.length) return // don't clobber an active chat
  let stash = null
  try { stash = JSON.parse(localStorage.getItem(GUEST_RESUME_KEY) || 'null') } catch { /* ignore */ }
  if (!stash || !Array.isArray(stash.messages) || !stash.messages.length) return
  if (Date.now() - (stash.ts || 0) > 30 * 60 * 1000) { localStorage.removeItem(GUEST_RESUME_KEY); return } // too old
  chat.messages = stash.messages.map((m, i) => ({ id: 'g' + i, role: m.role, parts: (m.content && m.content.parts) || [] }))
  registerFromMessages() // rebuild the product registry so a later PR can bind the saved product
  scrollDown()
}

watch(() => chat.status, async (s) => {
  scrollDown()
  registerFromMessages() // keep the product registry current with what's shown
  // Flush a product pick that was queued while the assistant was streaming.
  if ((s === 'ready' || s === 'error') && pendingPick.value) {
    const { p, assisted } = pendingPick.value
    pendingPick.value = null
    assisted ? onAssistedProduct(p) : onPickProduct(p)
    return
  }
  if (s === 'ready' && user.value && chat.messages.length > savedCount.value) {
    await persist()
    maybeRetitle()
  }
  // First reply with results just finished for a guest → soft conversion nudge.
  if (s === 'ready' && !user.value) maybeSoftGate()
})

// ChatGPT-style: after the first reply, ask a fast model for a concise title
// based on what the user actually wants, then rename the thread. Best-effort.
async function maybeRetitle() {
  if (retitled.value || !activeId.value) return
  const firstText = (m) => (m?.parts || []).filter((p) => p.type === 'text').map((p) => p.text).join(' ').trim()
  const userText = firstText(chat.messages.find((m) => m.role === 'user'))
  const assistantText = firstText(chat.messages.find((m) => m.role === 'assistant'))
  if (!userText || !assistantText) return
  retitled.value = true
  try {
    const { title } = await $fetch('/api/title', { method: 'POST', body: { user: userText, assistant: assistantText } })
    if (!title) return
    await $customFetch(`/conversations/${activeId.value}`, { method: 'PATCH', body: { title } })
    const c = conversations.value.find((x) => x.id === activeId.value)
    if (c) c.title = title
  } catch (e) { console.error('retitle failed', e) }
}

async function persist() {
  try {
    const delta = chat.messages.slice(savedCount.value).map((m) => ({ role: m.role, content: { parts: cleanParts(m.parts) } }))
    if (!delta.length) return
    // Go through the SAME guarded creator (don't POST a second conversation here).
    if (!activeId.value) {
      const firstUser = chat.messages.find((m) => m.role === 'user')
      const title = (firstUser?.parts || []).filter((p) => p.type === 'text').map((p) => p.text).join(' ').trim()
      await ensureConversation(title)
    }
    if (!activeId.value) return // creation failed (e.g. guest) — don't post to a null id
    await $customFetch(`/conversations/${activeId.value}/messages`, { method: 'POST', body: { messages: delta } })
    savedCount.value = chat.messages.length
    // Keep state local — no full list refetch every turn. Cache the thread and
    // bump it to the top of the sidebar.
    msgCache.set(activeId.value, { messages: chat.messages, oldestId: oldestLoadedId.value, hasMore: hasMoreOlder.value, products: savedProducts.value })
    bumpActiveToTop()
  } catch (e) { console.error('persist failed', e) }
}

function bumpActiveToTop() {
  const list = conversations.value
  const i = list.findIndex((c) => c.id === activeId.value)
  if (i > 0) conversations.value = [list[i], ...list.slice(0, i), ...list.slice(i + 1)]
}

function newChat() {
  openSeq++ // invalidate any in-flight openChat
  loadingChat.value = false
  chat.messages = []
  activeId.value = null
  savedCount.value = 0
  retitled.value = false
  oldestLoadedId.value = null
  hasMoreOlder.value = false
  savedProducts.value = []
  drawerOpen.value = false
  // Starting fresh on purpose → drop any guest gate stash so the old chat won't
  // resurrect on a later refresh (the post-register resume only matters if they
  // were mid-purchase, which a deliberate "new chat" supersedes).
  try { localStorage.removeItem(GUEST_RESUME_KEY) } catch { /* ignore */ }
}

async function openChat(id) {
  // Normalize to a number so activeId is always the same type as the API's
  // conversation ids (the sidebar highlight + all `=== activeId` checks rely on
  // it). Route params arrive as strings, sidebar clicks as numbers.
  id = Number(id)
  // Highlight + close drawer instantly; serve from cache if we have it.
  activeId.value = id
  retitled.value = true
  drawerOpen.value = false
  const cached = msgCache.get(id)
  if (cached) {
    loadingChat.value = false
    chat.messages = cached.messages
    oldestLoadedId.value = cached.oldestId
    hasMoreOlder.value = cached.hasMore
    savedProducts.value = cached.products || []
    savedCount.value = chat.messages.length
    scrollDown()
    return
  }
  // Show the loading skeleton; clear the previous chat so we don't show stale
  // content. openSeq guards against spam-tapping multiple chats (latest wins).
  const seq = ++openSeq
  loadingChat.value = true
  chat.messages = []
  savedProducts.value = []
  try {
    const r = await $customFetch(`/conversations/${id}?limit=${PAGE}`)
    if (seq !== openSeq) return // a newer open won
    const msgs = r.data.messages.map(mapMsg)
    chat.messages = msgs
    oldestLoadedId.value = msgs.length ? msgs[0].id : null
    hasMoreOlder.value = !!r.data.has_more
    savedProducts.value = r.data.products || [] // full registry, derived from all history
    savedCount.value = msgs.length
    msgCache.set(id, { messages: msgs, oldestId: oldestLoadedId.value, hasMore: hasMoreOlder.value, products: savedProducts.value })
    scrollDown()
  } catch (e) {
    console.error(e)
    // Bad/forbidden id (e.g. a stale or pasted link) — fall back to the
    // new-chat view so the user isn't stranded on a broken URL.
    if (seq === openSeq && activeId.value === id) { activeId.value = null }
  } finally {
    if (seq === openSeq) loadingChat.value = false
  }
}

// Load the previous page of messages when the user scrolls near the top, keeping
// the scroll position pinned so the view doesn't jump.
async function loadOlder() {
  if (loadingOlder.value || !hasMoreOlder.value || !activeId.value || !oldestLoadedId.value) return
  loadingOlder.value = true
  const el = scroller.value
  const prevHeight = el ? el.scrollHeight : 0
  try {
    const r = await $customFetch(`/conversations/${activeId.value}?limit=${PAGE}&before=${oldestLoadedId.value}`)
    const older = (r.data.messages || []).map(mapMsg)
    if (older.length) {
      chat.messages = [...older, ...chat.messages]
      savedCount.value += older.length // prepended messages are already saved
      oldestLoadedId.value = older[0].id
      hasMoreOlder.value = !!r.data.has_more
      msgCache.set(activeId.value, { messages: chat.messages, oldestId: oldestLoadedId.value, hasMore: hasMoreOlder.value, products: savedProducts.value })
      nextTick(() => {
        if (!el) return
        const prev = el.style.scrollBehavior
        el.style.scrollBehavior = 'auto'
        el.scrollTop = el.scrollHeight - prevHeight
        el.style.scrollBehavior = prev
      })
    } else {
      hasMoreOlder.value = false
    }
  } catch (e) { console.error(e) } finally { loadingOlder.value = false }
}

function onScroll() {
  if (scroller.value && scroller.value.scrollTop < 120 && hasMoreOlder.value && !loadingOlder.value) loadOlder()
}

async function deleteConversation(id) {
  // Optimistic: drop it from the sidebar + cache immediately, then sync.
  conversations.value = conversations.value.filter((c) => c.id !== id)
  msgCache.delete(id)
  if (activeId.value === id) newChat()
  try { await $customFetch(`/conversations/${id}`, { method: 'DELETE' }) }
  catch (e) { console.error(e); loadConversations() }
}

// Don't persist base64 image data-URLs to the DB — replace file parts with a
// lightweight marker (the product was already identified in the conversation).
function cleanParts(parts) {
  return (parts || [])
    // Drop tool calls that never produced output — a dangling tool_use breaks
    // the next request to the model when this history is replayed.
    .filter((p) => !(typeof p?.type === 'string' && p.type.startsWith('tool-') && p.state !== 'output-available' && p.state !== 'output-error'))
    .map((p) => {
      if (p?.type === 'file') return { type: 'text', text: p?.mediaType === 'application/pdf' ? '📎 (PDF)' : '📎 (imagen)' }
      // Strip heavy base64 thumbnails (Google Shopping) from persisted tool
      // outputs so history rows stay small; the live gallery already rendered.
      const prods = p?.output?.products
      if (Array.isArray(prods)) {
        return {
          ...p,
          output: {
            ...p.output,
            products: prods.map((x) => (typeof x?.image === 'string' && x.image.startsWith('data:')) ? { ...x, image: null } : x),
          },
        }
      }
      return p
    })
}

function scrollDown() {
  nextTick(() => { if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight })
}
</script>

<style scoped>
.msg-enter-from { opacity: 0; transform: translateY(10px); }
.msg-enter-active { transition: opacity .3s ease, transform .3s cubic-bezier(.2,.8,.2,1); }
.msg-move { transition: transform .3s cubic-bezier(.2,.8,.2,1); }

.chip-enter-from { opacity: 0; transform: translateY(8px) scale(.96); }
.chip-enter-active { transition: opacity .35s ease, transform .35s cubic-bezier(.2,.8,.2,1); }

.fade-fast-enter-from, .fade-fast-leave-to { opacity: 0; }
.fade-fast-enter-active, .fade-fast-leave-active { transition: opacity .2s ease; }

.pop-enter-from { opacity: 0; transform: translateY(12px) scale(.97); }
.pop-enter-active { transition: opacity .3s ease, transform .3s cubic-bezier(.2,.8,.2,1); }

/* Memory modal: slide up from the bottom on mobile (sheet)… */
.sheet-enter-from, .sheet-leave-to { opacity: 0; transform: translateY(100%); }
.sheet-enter-active, .sheet-leave-active { transition: opacity .25s ease, transform .32s cubic-bezier(.2,.8,.2,1); }
/* …and a subtle pop when it's a centered desktop dialog. */
@media (min-width: 768px) {
  .sheet-enter-from, .sheet-leave-to { transform: translateY(10px) scale(.97); }
}
@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active, .sheet-leave-active { transition: opacity .2s ease; }
  .sheet-enter-from, .sheet-leave-to { transform: none; }
}

.drawer-enter-from, .drawer-leave-to { transform: translateX(-100%); }
.drawer-enter-active, .drawer-leave-active { transition: transform .28s cubic-bezier(.2,.8,.2,1); }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }
.backdrop-enter-active, .backdrop-leave-active { transition: opacity .25s ease; }

/* Quick pills breathe in after the page settles ("ready when you are"). */
.chip-in { opacity: 0; animation: chip-in .45s ease forwards; }
@keyframes chip-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

/* Endless store carousel — very slow, very subtle, always moving. */
.marquee-track { animation: marquee 70s linear infinite; }
@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

/* Shipment widget expand/collapse. */
.expand-enter-from, .expand-leave-to { opacity: 0; }
.expand-enter-active, .expand-leave-active { transition: opacity .2s ease; }

.typing { display: inline-flex; gap: 4px; align-items: center; }
.typing i { width: 6px; height: 6px; border-radius: 9999px; background: #9ca3af; display: inline-block; animation: typing-blink 1.3s infinite both; }
.typing i:nth-child(2) { animation-delay: .18s; }
.typing i:nth-child(3) { animation-delay: .36s; }
@keyframes typing-blink { 0%, 70%, 100% { opacity: .25; transform: translateY(0); } 35% { opacity: 1; transform: translateY(-2px); } }

@media (prefers-reduced-motion: reduce) {
  .msg-enter-active, .chip-enter-active, .fade-fast-enter-active, .pop-enter-active, .drawer-enter-active, .drawer-leave-active, .backdrop-enter-active, .backdrop-leave-active { transition: none; }
  .typing i { animation: none; }
  .marquee-track { animation: none; }
  .chip-in { opacity: 1; animation: none; }
}
</style>
