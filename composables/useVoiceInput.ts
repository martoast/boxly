/**
 * Push-to-talk voice input: record a clip with MediaRecorder, send it to
 * /api/transcribe (OpenAI), return the transcribed text. Used by the shopping
 * assistant's mic button.
 */
export function useVoiceInput() {
  const recording = ref(false)
  const transcribing = ref(false)
  const error = ref<string | null>(null)

  let mediaRecorder: MediaRecorder | null = null
  let chunks: BlobPart[] = []

  async function start() {
    error.value = null
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder = new MediaRecorder(stream)
      chunks = []
      mediaRecorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
      mediaRecorder.start()
      recording.value = true
    } catch (e: any) {
      error.value = 'No pudimos acceder al micrófono.'
      recording.value = false
    }
  }

  function stop(): Promise<string> {
    return new Promise((resolve) => {
      const mr = mediaRecorder
      if (!mr) return resolve('')
      mr.onstop = async () => {
        recording.value = false
        mr.stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks, { type: 'audio/webm' })
        if (!blob.size) return resolve('')
        transcribing.value = true
        try {
          const fd = new FormData()
          fd.append('audio', blob, 'voice.webm')
          const res: any = await $fetch('/api/transcribe', { method: 'POST', body: fd })
          resolve((res?.text || '').trim())
        } catch (e) {
          error.value = 'No se pudo transcribir el audio.'
          resolve('')
        } finally {
          transcribing.value = false
        }
      }
      mr.stop()
    })
  }

  /** Toggle: start recording, or stop and return the transcript. */
  async function toggle(): Promise<string | undefined> {
    if (recording.value) return await stop()
    await start()
    return undefined
  }

  return { recording, transcribing, error, start, stop, toggle }
}
