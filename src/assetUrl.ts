export function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}assets/${path.replace(/^\/+/, '')}`
}
