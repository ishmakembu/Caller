import { useState, useCallback } from 'react'
import { useCallStore } from '@/store/callStore'

export function useScreenShare() {
  const [isSharing, setIsSharing] = useState(false)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const startScreenShare = useCallStore((s) => s.setScreenStream)

  const start = useCallback(async () => {
    if (isIOS) {
      alert('Screen sharing is not available on iOS')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      })

      startScreenShare(stream)
      setIsSharing(true)

      stream.getVideoTracks()[0].onended = () => {
        stop()
      }
    } catch {
      // User cancelled
    }
  }, [isIOS, startScreenShare])

  const stop = useCallback(() => {
    startScreenShare(null)
    setIsSharing(false)
  }, [startScreenShare])

  return { isSharing, start, stop, isSupported: !isIOS }
}
