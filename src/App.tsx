import gsap from 'gsap'
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { assetUrl } from './assetUrl'

const Phase1Scene = lazy(async () => ({
  default: (await import('./phases/Phase1Scene')).Phase1Scene,
}))
const Phase2Scene = lazy(async () => ({
  default: (await import('./phases/Phase2Scene')).Phase2Scene,
}))
const Phase3Scene = lazy(async () => ({
  default: (await import('./phases/Phase3Scene')).Phase3Scene,
}))
const Phase4Scene = lazy(async () => ({
  default: (await import('./phases/Phase4Scene')).Phase4Scene,
}))

type PhaseId = 1 | 2 | 3 | 4

function isAndroidPhoneBrowser() {
  return /Android/i.test(navigator.userAgent) && /Mobile/i.test(navigator.userAgent)
}

const phaseMeta: Array<{ id: PhaseId; title: string; subtitle: string }> = [
  { id: 1, title: '破雾寻幽', subtitle: '晨雾擦拭' },
  { id: 2, title: '掌中微缩', subtitle: '亭台赏鉴' },
  { id: 3, title: '灯火阑珊', subtitle: '点灯成诗' },
  { id: 4, title: '一窗一景', subtitle: '沙盘造景' },
]

function App() {
  const [isAndroidPhone] = useState(isAndroidPhoneBrowser)
  const [isLandscape, setIsLandscape] = useState(() => window.matchMedia('(orientation: landscape)').matches)
  const [hasStartedMobileExperience, setHasStartedMobileExperience] = useState(false)
  const [orientationRequestFailed, setOrientationRequestFailed] = useState(false)
  const parsePhaseFromHash = useCallback((): PhaseId => {
    const value = Number(window.location.hash.replace('#phase-', ''))
    return value >= 1 && value <= 4 ? (value as PhaseId) : 1
  }, [])

  const [currentPhase, setCurrentPhase] = useState<PhaseId>(() => parsePhaseFromHash())
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!isAndroidPhone) return

    const orientationQuery = window.matchMedia('(orientation: landscape)')
    const updateOrientation = () => setIsLandscape(orientationQuery.matches)
    orientationQuery.addEventListener('change', updateOrientation)
    window.addEventListener('resize', updateOrientation)

    return () => {
      orientationQuery.removeEventListener('change', updateOrientation)
      window.removeEventListener('resize', updateOrientation)
    }
  }, [isAndroidPhone])

  const enterMobileExperience = async () => {
    setHasStartedMobileExperience(true)
    let locked = false

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      // Some Android browsers do not expose element fullscreen.
    }

    try {
      await screen.orientation.lock('landscape')
      locked = true
    } catch {
      // A manual device rotation remains available below.
    }

    setOrientationRequestFailed(!locked)
    setIsLandscape(window.matchMedia('(orientation: landscape)').matches)
  }

  useEffect(() => {
    const handleHashChange = () => {
      const nextPhase = parsePhaseFromHash()
      setCurrentPhase((current) => (current === nextPhase ? current : nextPhase))
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [parsePhaseFromHash])

  useEffect(() => {
    const imageAssets = [
      assetUrl('bg-clear-garden.webp'),
      assetUrl('window-frame-mask.png'),
      assetUrl('模块二背景图.webp'),
      assetUrl('ink-dark-bg.webp'),
      assetUrl('ink-color-bg.webp'),
      assetUrl('element-pavilion.webp'),
      assetUrl('element-taihu-rock（1）.webp'),
      assetUrl('element-taihu-rock（2）.webp'),
      assetUrl('element-flora.webp'),
    ]

    const loadImage = (src: string) => {
      const image = new Image()
      image.decoding = 'async'
      image.src = src
    }

    // Keep the first scene responsive; the remaining scene art can arrive in idle time.
    imageAssets.slice(0, 3).forEach(loadImage)

    const loadDeferredImages = () => {
      imageAssets.slice(3).forEach(loadImage)
    }

    let idleImageHandle: number | undefined
    let imageTimeoutHandle: number | undefined

    if (typeof window.requestIdleCallback === 'function') {
      idleImageHandle = window.requestIdleCallback(loadDeferredImages, { timeout: 2000 })
    } else {
      imageTimeoutHandle = setTimeout(loadDeferredImages, 1500)
    }

    const preloadLinks = [
      { href: assetUrl('tags.json'), rel: 'prefetch' },
    ]
      .map(({ href, rel }) => {
        const link = document.createElement('link')
        link.rel = rel
        link.href = href
        link.as = 'fetch'
        link.crossOrigin = 'anonymous'
        link.setAttribute('data-yuyuan-preload', href)
        document.head.appendChild(link)
        return link
      })

    let idleLinkHandle: number | undefined
    let linkTimeoutHandle: number | undefined

    const addDeferredPreloadLinks = () => {
      ;[
        { href: assetUrl('suzhou-pavilion.glb'), rel: 'prefetch' },
        { href: assetUrl('音频.mp3'), rel: 'prefetch' },
      ].forEach(({ href, rel }) => {
        const link = document.createElement('link')
        link.rel = rel
        link.href = href
        link.setAttribute('data-yuyuan-preload', href)
        document.head.appendChild(link)
        preloadLinks.push(link)
      })
    }

    if (typeof window.requestIdleCallback === 'function') {
      idleLinkHandle = window.requestIdleCallback(addDeferredPreloadLinks, { timeout: 2500 })
    } else {
      linkTimeoutHandle = setTimeout(addDeferredPreloadLinks, 2000)
    }

    return () => {
      if (idleImageHandle !== undefined) {
        window.cancelIdleCallback(idleImageHandle)
      }

      if (imageTimeoutHandle !== undefined) {
        window.clearTimeout(imageTimeoutHandle)
      }

      if (idleLinkHandle !== undefined) {
        window.cancelIdleCallback(idleLinkHandle)
      }

      if (linkTimeoutHandle !== undefined) {
        window.clearTimeout(linkTimeoutHandle)
      }

      preloadLinks.forEach((link) => {
        link.remove()
      })
    }
  }, [])

  useEffect(() => {
    window.history.replaceState(null, '', `#phase-${currentPhase}`)
  }, [currentPhase])

  useEffect(() => {
    const container = contentRef.current

    if (!container) {
      return
    }

    gsap.set(container, { opacity: 1, y: 0 })
  }, [])

  const playBackgroundAudio = useCallback(async () => {
    const audio = backgroundAudioRef.current

    if (!audio) {
      return false
    }

    try {
      audio.volume = 1
      audio.loop = true
      audio.muted = false
      await audio.play()
      setIsAudioPlaying(true)
      return true
    } catch {
      setIsAudioPlaying(false)
      return false
    }
  }, [])

  const pauseBackgroundAudio = useCallback(() => {
    const audio = backgroundAudioRef.current

    if (!audio) {
      return
    }

    audio.pause()
    setIsAudioPlaying(false)
  }, [])

  useEffect(() => {
    const audio = backgroundAudioRef.current

    if (!audio) {
      return
    }

    const handlePlay = () => {
      setIsAudioPlaying(true)
    }

    const handlePause = () => {
      setIsAudioPlaying(false)
    }

    const handleFirstInteraction = async () => {
      const didPlay = await playBackgroundAudio()

      if (didPlay) {
        window.removeEventListener('pointerdown', handleFirstInteraction)
        window.removeEventListener('keydown', handleFirstInteraction)
        window.removeEventListener('touchstart', handleFirstInteraction)
      }
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true })
    window.addEventListener('keydown', handleFirstInteraction)
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true })

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.pause()
      window.removeEventListener('pointerdown', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
    }
  }, [pauseBackgroundAudio, playBackgroundAudio])

  const currentMeta = useMemo(
    () => phaseMeta.find((phase) => phase.id === currentPhase) ?? phaseMeta[0],
    [currentPhase],
  )
  const isInkPhase = currentPhase === 4

  const transitionToPhase = useCallback(
    (nextPhase: PhaseId) => {
      const container = contentRef.current

      if (!container || nextPhase === currentPhase || isTransitioning) {
        return
      }

      setIsTransitioning(true)

      gsap.to(container, {
        opacity: 0,
        y: 18,
        duration: 0.32,
        ease: 'power2.inOut',
        onComplete: () => {
          setCurrentPhase(nextPhase)

          requestAnimationFrame(() => {
            gsap.fromTo(
              container,
              { opacity: 0, y: 18 },
              {
                opacity: 1,
                y: 0,
                duration: 0.48,
                ease: 'power2.out',
                onComplete: () => {
                  setIsTransitioning(false)
                },
              },
            )
          })
        },
      })
    },
    [currentPhase, isTransitioning],
  )

  const toggleBackgroundAudio = useCallback(async () => {
    if (isAudioPlaying) {
      pauseBackgroundAudio()
      return
    }

    await playBackgroundAudio()
  }, [isAudioPlaying, pauseBackgroundAudio, playBackgroundAudio])

  const showMobileGate = isAndroidPhone && (!hasStartedMobileExperience || !isLandscape)

  return (
    <main className={`relative ${isAndroidPhone ? 'android-phone' : ''}`}>
      <audio ref={backgroundAudioRef} src={assetUrl('音频.mp3')} loop preload="metadata" className="hidden" />
      {showMobileGate ? (
        <div className="mobile-orientation-gate" style={{ backgroundImage: `linear-gradient(180deg, rgba(8, 18, 20, .38), rgba(8, 18, 20, .78)), url("${assetUrl('bg-clear-garden.webp')}")` }}>
          <div className="mobile-orientation-card">
            <span className="mobile-orientation-mark" aria-hidden="true">▭</span>
            <p className="mobile-orientation-eyebrow">游园惊梦 · 苏州园林</p>
            <h1>{hasStartedMobileExperience ? '请横过手机' : '横屏开启游园之旅'}</h1>
            <p>
              {hasStartedMobileExperience
                ? '横屏后将自动进入完整体验。若屏幕没有转动，请开启手机的自动旋转。'
                : '点击开始后，浏览器将尝试进入全屏并切换为横屏。'}
            </p>
            <button type="button" onClick={() => void enterMobileExperience()}>
              {hasStartedMobileExperience && orientationRequestFailed ? '重试横屏' : '开始横屏体验'}
            </button>
          </div>
        </div>
      ) : (
        <>
      <header className="app-header fixed inset-x-0 top-0 z-[500] px-4 py-4 lg:px-6">
        <div className="app-header-inner mx-auto flex max-w-[1600px] flex-col gap-3 text-white lg:flex-row lg:items-center lg:justify-between">
          <div className="app-header-brand pointer-events-none">
            <p className="app-header-title inline-flex rounded-full border border-white/28 bg-[rgba(12,18,28,0.52)] px-5 py-2.5 text-[17px] font-black tracking-[0.28em] text-white shadow-[0_14px_30px_rgba(0,0,0,0.24)] backdrop-blur-md drop-shadow-[0_4px_16px_rgba(0,0,0,0.18)] lg:px-6 lg:py-3 lg:text-[19px]">
              游园惊梦·一站沉浸式体验苏州园林
            </p>
            <div className="app-header-subtitle mt-2 flex items-center gap-3">
              <h1 className="text-lg font-semibold tracking-[0.18em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.28)] lg:text-xl">
                {currentMeta.title}
              </h1>
              <span className="rounded-full border border-white/24 bg-[rgba(255,255,255,0.14)] px-3 py-1 text-[11px] tracking-[0.18em] text-white/82 backdrop-blur-md">
                {currentMeta.subtitle}
              </span>
            </div>
          </div>

          <nav className="app-phase-nav mx-auto flex w-full max-w-[720px] flex-wrap items-center justify-center gap-4 lg:flex-1 lg:gap-5">
            {phaseMeta.map((phase) => {
              const isActive = phase.id === currentPhase

              return (
                <button
                  key={phase.id}
                  type="button"
                  onClick={() => transitionToPhase(phase.id)}
                  disabled={isTransitioning}
                  className={`app-phase-button min-w-[112px] rounded-full border px-5 py-2.5 text-xs tracking-[0.14em] backdrop-blur-md transition ${
                    isInkPhase
                      ? isActive
                        ? 'border-black/70 bg-[rgba(17,20,24,0.78)] text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)]'
                        : 'border-black/50 bg-[rgba(17,20,24,0.54)] text-[rgba(255,255,255,0.96)] hover:bg-[rgba(17,20,24,0.68)]'
                      : isActive
                        ? 'border-white/62 bg-[rgba(255,255,255,0.32)] text-white shadow-[0_8px_24px_rgba(0,0,0,0.16)]'
                        : 'border-white/34 bg-[rgba(255,255,255,0.18)] text-white/92 hover:bg-[rgba(255,255,255,0.24)]'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {phase.title}
                </button>
              )
            })}
          </nav>
          <button
            type="button"
            onClick={() => {
              void toggleBackgroundAudio()
            }}
            aria-label={isAudioPlaying ? '关闭背景音乐' : '开启背景音乐'}
            title={isAudioPlaying ? '关闭背景音乐' : '开启背景音乐'}
            className="app-audio-button ml-auto inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/50 bg-[rgba(255,255,255,0.34)] text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-md transition hover:bg-[rgba(255,255,255,0.46)] lg:ml-0"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current">
              <path
                d="M10 8.5v7a1 1 0 0 1-.42.81l-2.66 1.9A1 1 0 0 1 5 17.4V6.6a1 1 0 0 1 1.92-.81l2.66 1.9A1 1 0 0 0 10 8.5Z"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M14 8.5a5 5 0 0 1 0 7" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M16.8 6a8.2 8.2 0 0 1 0 12" strokeWidth="1.8" strokeLinecap="round" className={isAudioPlaying ? 'opacity-100' : 'opacity-40'} />
              {!isAudioPlaying ? <path d="M5 5l14 14" strokeWidth="1.8" strokeLinecap="round" /> : null}
            </svg>
          </button>
        </div>
      </header>

      <div ref={contentRef}>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#11161c] text-white">
              <div className="rounded-[28px] border border-white/14 bg-white/8 px-8 py-6 text-center backdrop-blur-md">
                <p className="text-[11px] tracking-[0.36em] text-white/65">游园惊梦</p>
                <p className="mt-3 text-lg tracking-[0.18em]">场景加载中...</p>
              </div>
            </div>
          }
        >
          {currentPhase === 1 && <Phase1Scene onContinue={() => transitionToPhase(2)} />}
          {currentPhase === 2 && <Phase2Scene onContinue={() => transitionToPhase(3)} />}
          {currentPhase === 3 && <Phase3Scene onContinue={() => transitionToPhase(4)} />}
          {currentPhase === 4 && <Phase4Scene />}
        </Suspense>
      </div>
        </>
      )}
    </main>
  )
}

export default App
