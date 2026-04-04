import { useEffect, useState, useCallback } from 'react'

export function useLocalMedia() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [acquiring, setAcquiring] = useState(false)

  const acquire = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return
    setAcquiring(true)
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setStream(s)
      setHasPermission(true)
    } catch {
      setHasPermission(false)
    } finally {
      setAcquiring(false)
    }
  }, [])

  const release = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
  }, [stream])

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [stream])

  return { stream, hasPermission, acquiring, acquire, release }
}
