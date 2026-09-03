// Thin reactive wrapper over createWhepViewerController (utils/liveShopping.ts).
// Follows the VoiceAssistant.vue viewer shape: server-minted short-lived
// credential, direct browser SDP exchange, explicit teardown — here recvonly
// video over WHEP, with DELETE-then-close teardown and one full reconnect on
// ICE failure (never restartIce() alone).
import { ref, onBeforeUnmount, getCurrentInstance } from 'vue'
import {
  createWhepViewerController,
  type ViewerTicket,
  type WhepState,
} from '../utils/liveShopping'

export function useWhepViewer(opts: {
  getTicket: () => ViewerTicket | null
  remintTicket: () => Promise<ViewerTicket>
}) {
  const state = ref<WhepState>('idle')
  const stream = ref<MediaStream | null>(null)

  const controller = createWhepViewerController({
    getTicket: opts.getTicket,
    remintTicket: opts.remintTicket,
    onTrack: (s) => { stream.value = s },
    onState: (s) => { state.value = s },
  })

  if (getCurrentInstance()) onBeforeUnmount(() => controller.stop())

  return { state, stream, start: controller.start, stop: controller.stop }
}
