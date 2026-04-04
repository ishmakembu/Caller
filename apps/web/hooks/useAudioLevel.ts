import { useState, useEffect } from 'react'

export function useAudioLevel(stream: MediaStream | null) {
  const [level, setLevel] = useState(0)

  useEffect(() => {
    if (!stream) {
      setLevel(0)
      return
    }

    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length === 0 || !audioTracks[0].enabled) {
      setLevel(0)
      return
    }

    let audioCtx: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    let source: MediaStreamAudioSourceNode | null = null
    let rafId = 0

    try {
      audioCtx = new AudioContext()
      analyser = audioCtx.createAnalyser()
      source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)
      analyser.fftSize = 256

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const measure = () => {
        analyser!.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        setLevel(avg)
        rafId = requestAnimationFrame(measure)
      }
      measure()
    } catch {
      // AudioContext not available
    }

    return () => {
      cancelAnimationFrame(rafId)
      source?.disconnect()
      audioCtx?.close()
    }
  }, [stream])

  return level
}
