/**
 * Voice input for the shopping assistant. Records a clip with MediaRecorder,
 * shows live audio levels (waveform) while recording, then sends the clip to
 * /api/transcribe (OpenAI) and returns the transcript. We NEVER send a voice
 * message — the transcript is dropped into the text input so the user can edit
 * it before sending.
 *
 * Cross-browser note: iOS Safari only records audio/mp4 (no webm), so we must
 * pick a supported mimeType and label the upload with the matching extension —
 * hardcoding webm made transcription fail on iPhones.
 */
const BAR_COUNT = 28

export function useVoiceInput() {
  const recording = ref(false)
  const transcribing = ref(false)
  const error = ref<string | null>(null)
  const levels = ref<number[]>(new Array(BAR_COUNT).fill(0))

  let mediaRecorder: MediaRecorder | null = null
  let chunks: BlobPart[] = []

  // Web Audio metering
  let audioCtx: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let rafId: number | null = null

  function pickMimeType(): string {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
      'audio/ogg;codecs=opus',
    ]
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
      for (const t of candidates) {
        try { if (MediaRecorder.isTypeSupported(t)) return t } catch { /* noop */ }
      }
    }
    return '' // let the browser choose its default
  }

  function extFor(mime: string): string {
    const m = (mime || '').toLowerCase()
    if (m.includes('mp4')) return 'mp4'
    if (m.includes('mpeg')) return 'mp3'
    if (m.includes('ogg')) return 'ogg'
    if (m.includes('wav')) return 'wav'
    return 'webm'
  }

  function startMeter(stream: MediaStream) {
    try {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext)
      audioCtx = new Ctx()
      audioCtx.resume?.()
      const src = audioCtx.createMediaStreamSource(stream)
      analyser = audioCtx.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.7
      src.connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        if (!analyser) return
        analyser.getByteFrequencyData(data)
        const bars: number[] = []
        const step = Math.max(1, Math.floor((data.length * 0.7) / BAR_COUNT)) // skip the dead high end
        for (let i = 0; i < BAR_COUNT; i++) {
          let sum = 0
          for (let j = 0; j < step; j++) sum += data[i * step + j] || 0
          // normalize 0..1 with a small floor so idle still shows a faint pulse
          bars.push(Math.min(1, Math.max(0.06, (sum / step) / 170)))
        }
        levels.value = bars
        rafId = requestAnimationFrame(tick)
      }
      tick()
    } catch { /* metering is best-effort */ }
  }

  function stopMeter() {
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
    try { audioCtx?.close() } catch { /* noop */ }
    audioCtx = null
    analyser = null
    levels.value = new Array(BAR_COUNT).fill(0)
  }

  async function start() {
    error.value = null
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = pickMimeType()
      mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      chunks = []
      mediaRecorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
      mediaRecorder.start()
      recording.value = true
      startMeter(stream)
    } catch (e: any) {
      error.value = 'No pudimos acceder al micrófono. Revisa los permisos.'
      recording.value = false
    }
  }

  function stop(): Promise<string> {
    return new Promise((resolve) => {
      const mr = mediaRecorder
      if (!mr) return resolve('')
      mr.onstop = async () => {
        recording.value = false
        stopMeter()
        mr.stream.getTracks().forEach((t) => t.stop())
        const type = mr.mimeType || 'audio/webm'
        const blob = new Blob(chunks, { type })
        if (!blob.size) return resolve('')
        transcribing.value = true
        try {
          const fd = new FormData()
          fd.append('audio', blob, `voice.${extFor(type)}`)
          const res: any = await $fetch('/api/transcribe', { method: 'POST', body: fd })
          resolve((res?.text || '').trim())
        } catch (e) {
          error.value = 'No se pudo transcribir el audio.'
          resolve('')
        } finally {
          transcribing.value = false
        }
      }
      try { mr.stop() } catch { resolve('') }
    })
  }

  /** Toggle: start recording, or stop and return the transcript. */
  async function toggle(): Promise<string | undefined> {
    if (recording.value) return await stop()
    await start()
    return undefined
  }

  return { recording, transcribing, error, levels, start, stop, toggle }
}
