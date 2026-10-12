const SITE_HOST = 'leizhidong-creator.github.io'
const SITE_PATH = '/Classical-Gardens-of-Suzhou'

type BaiduCommand = Array<string | number>

declare global {
  interface Window {
    _hmt?: BaiduCommand[]
  }
}

function isPublishedSite() {
  return import.meta.env.PROD
    && window.location.hostname === SITE_HOST
    && (window.location.pathname === SITE_PATH
      || window.location.pathname.startsWith(`${SITE_PATH}/`))
}

export function trackGardenEvent(action: string, label: string) {
  if (!isPublishedSite()) {
    return
  }

  window._hmt ??= []
  window._hmt.push(['_trackEvent', 'garden_experience', action, label])
}
