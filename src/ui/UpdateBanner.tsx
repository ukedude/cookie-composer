import { useRegisterSW } from 'virtual:pwa-register/react'
import styles from './UpdateBanner.module.css'

export function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true })

  if (!needRefresh) return null

  return (
    <button type="button" className={styles.banner} onClick={() => updateServiceWorker(true)}>
      Update available — tap to reload
    </button>
  )
}
