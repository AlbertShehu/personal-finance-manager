import * as React from "react"

const MOBILE_QUERY = "(max-width: 767px)"

// Hook i përgjithshëm për media query
function useMediaQuery(query) {
  const subscribe = React.useCallback((cb) => {
    if (typeof window === "undefined") return () => {}
    const mql = window.matchMedia(query)
    const handler = () => cb()
    // Compat: modern + legacy
    if (mql.addEventListener) mql.addEventListener("change", handler)
    else mql.addListener(handler)
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", handler)
      else mql.removeListener(handler)
    }
  }, [query])

  const getSnapshot = React.useCallback(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia(query).matches
  }, [query])

  // Server snapshot → false për të shmangur flicker
  const getServerSnapshot = React.useCallback(() => false, [])

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function useIsMobile() {
  return useMediaQuery(MOBILE_QUERY)
}

export default useIsMobile
