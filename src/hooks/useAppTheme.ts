import { useEffect } from 'react'
import { useSettingsStore } from '../stores/useSettingsStore'
import { SETTINGS_KEY } from '../utils/settingsStorage'
export function useAppTheme() {
  const theme = useSettingsStore((state) => state.settings.theme)
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme }, [theme])
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === SETTINGS_KEY || event.key === null) useSettingsStore.getState().reload() }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])
}
