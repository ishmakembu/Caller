import { useState, useEffect, useCallback } from 'react'

interface DeviceInfo {
  deviceId: string
  label: string
  kind: MediaDeviceKind
}

export function useDevices() {
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [loading, setLoading] = useState(false)

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      setDevices(
        allDevices.map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `${d.kind} (${d.deviceId.slice(0, 8)}...)`,
          kind: d.kind as MediaDeviceKind,
        })),
      )
    } catch {
      // Permission not granted yet
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const audioInputs = devices.filter((d) => d.kind === 'audioinput')
  const videoInputs = devices.filter((d) => d.kind === 'videoinput')
  const audioOutputs = devices.filter((d) => d.kind === 'audiooutput')

  return {
    audioInputs,
    videoInputs,
    audioOutputs: isIOS ? [] : audioOutputs,
    loading,
    refresh,
    showAudioOutput: !isIOS,
  }
}
