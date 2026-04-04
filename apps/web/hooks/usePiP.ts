import { useState, useCallback } from 'react'

export function usePiP() {
  const [isActive, setIsActive] = useState(false)
  const isSupported = typeof document !== 'undefined' && 'pictureInPictureEnabled' in document
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isAvailable = isSupported && !isIOS

  const start = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!isAvailable) return
    try {
      await videoElement.requestPictureInPicture()
      setIsActive(true)
    } catch {
      // PiP failed
    }
  }, [isAvailable])

  const stop = useCallback(async () => {
    if (typeof document !== 'undefined' && document.pictureInPictureElement) {
      try {
        await document.exitPictureInPicture()
        setIsActive(false)
      } catch {
        // exit failed
      }
    }
  }, [])

  return { isActive, start, stop, isAvailable }
}
