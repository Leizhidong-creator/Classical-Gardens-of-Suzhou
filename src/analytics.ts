const BAIDU_SITE_ID = '9c58ecbdb3251fd88e603fbdfb4a8e38'
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

export function installAnalytics() {
  if (!isPublishedSite() || document.querySelector('[data-garden-analytics]')) {
    return
  }

  window._hmt ??= []

  const script = document.createElement('script')
  script.async = true
  script.src = `https://hm.baidu.com/hm.js?${BAIDU_SITE_ID}`
  script.dataset.gardenAnalytics = 'baidu'
  document.head.appendChild(script)
}

export function trackGardenEvent(action: string, label: string) {
  if (!isPublishedSite()) {
    return
  }

  window._hmt ??= []
  window._hmt.push(['_trackEvent', 'garden_experience', action, label])
}
