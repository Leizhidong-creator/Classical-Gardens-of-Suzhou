import gsap from 'gsap'
import { useEffect, useMemo, useRef, useState } from 'react'

type Phase3SceneProps = {
  onContinue: () => void
}

type PoemEntry = {
  id: string
  label: string
  poem: string
  note: string
  variant: 'left-primary' | 'left-secondary' | 'right-side'
  position: {
    left?: string
    right?: string
    top?: string
    bottom?: string
  }
}

const POEMS: PoemEntry[] = [
  {
    id: 'poem-1',
    label: '其一',
    poem: '不到园林，怎知春色如许。',
    note: '一灯初启',
    variant: 'left-primary',
    position: {
      left: '5%',
      top: '21%',
    },
  },
  {
    id: 'poem-2',
    label: '其二',
    poem: '清风明月本无价，近水远山皆有情。',
    note: '再点一灯',
    variant: 'left-secondary',
    position: {
      left: '15%',
      top: '16%',
    },
  },
  {
    id: 'poem-3',
    label: '其三',
    poem: '疏影横斜水清浅，暗香浮动月黄昏。',
    note: '三阙既成',
    variant: 'right-side',
    position: {
      right: '6%',
      top: '18%',
    },
  },
]

export function Phase3Scene({ onContinue }: Phase3SceneProps) {
  const darkImageRef = useRef<HTMLImageElement | null>(null)
  const colorImageRef = useRef<HTMLImageElement | null>(null)
  const flashRef = useRef<HTMLDivElement | null>(null)
  const turbulenceRef = useRef<SVGFETurbulenceElement | null>(null)
  const displacementRef = useRef<SVGFEDisplacementMapElement | null>(null)
  const poemCardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [clickCount, setClickCount] = useState(0)
  const isLit = clickCount > 0 && clickCount % 2 === 1
  const visiblePoems = useMemo(() => POEMS.slice(0, clickCount), [clickCount])

  useEffect(() => {
    const darkImage = darkImageRef.current
    const colorImage = colorImageRef.current
    const flash = flashRef.current
    const turbulence = turbulenceRef.current
    const displacement = displacementRef.current

    if (!darkImage || !colorImage || !flash || !turbulence || !displacement) {
      return
    }

    if (clickCount === 0) {
      gsap.set(darkImage, { opacity: 1 })
      gsap.set(colorImage, { opacity: 0 })
      gsap.set(flash, { opacity: 0 })
      return
    }

    const latestCard = poemCardRefs.current[clickCount - 1]
    const distortion = { frequency: 0.078, scale: 54 }

    gsap.killTweensOf([darkImage, colorImage, flash, distortion, latestCard])

    const timeline = gsap.timeline()

    timeline.to(
      darkImage,
      {
        opacity: isLit ? 0 : 1,
        duration: 0.34,
        ease: 'power2.out',
      },
      0,
    )

    timeline.to(
      colorImage,
      {
        opacity: isLit ? 1 : 0,
        duration: 0.34,
        ease: 'power2.out',
      },
      0,
    )

    timeline.fromTo(
      flash,
      { opacity: 0 },
      {
        opacity: isLit ? 0.34 : 0.2,
        duration: 0.14,
        ease: 'power1.out',
        yoyo: true,
        repeat: 1,
      },
      0,
    )

    if (latestCard) {
      timeline.fromTo(
        latestCard,
        { autoAlpha: 0, y: 22, scale: 0.94 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' },
        0.16,
      )
    }

    gsap.fromTo(
      distortion,
      { frequency: 0.078, scale: 54 },
      {
        frequency: 0.012,
        scale: 8,
        duration: 1.6,
        ease: 'power3.out',
        onUpdate: () => {
          turbulence.setAttribute(
            'baseFrequency',
            `${distortion.frequency} ${distortion.frequency * 0.72}`,
          )
          displacement.setAttribute('scale', `${distortion.scale}`)
        },
      },
    )

    return () => {
      timeline.kill()
    }
  }, [clickCount, isLit])

  const handleLanternClick = () => {
    if (clickCount >= POEMS.length) {
      onContinue()
      return
    }

    setClickCount((current) => current + 1)
  }

  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-[#06090d] text-[#f3f1ec]">
      <svg className="pointer-events-none absolute h-0 w-0">
        <filter id="ink-poem-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            ref={turbulenceRef}
            type="fractalNoise"
            baseFrequency="0.095 0.068"
            numOctaves="2"
            seed="12"
            result="noise"
          />
          <feDisplacementMap
            ref={displacementRef}
            in="SourceGraphic"
            in2="noise"
            scale="88"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/第三幕背景.jpg')" }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pb-6 pt-20 md:px-8 md:pb-8 md:pt-24">
        <div className="flex items-center justify-between">
          <span className="inline-flex rounded-full border border-white/18 bg-[rgba(255,255,255,0.06)] px-4 py-1 text-[11px] tracking-[0.38em] text-[#d8ddd9] backdrop-blur-md">
            PHASE 3
          </span>
          {clickCount >= POEMS.length ? (
            <button
              type="button"
              onClick={onContinue}
              className="rounded-full border border-white/18 bg-[rgba(248,244,235,0.14)] px-5 py-2 text-xs tracking-[0.2em] text-[#fbf8ef] backdrop-blur-md transition hover:bg-[rgba(248,244,235,0.2)]"
            >
              进入下一幕
            </button>
          ) : null}
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          <div className="pointer-events-none absolute inset-0 z-10">
            {visiblePoems.map((entry, index) => (
              <div
                key={entry.id}
                ref={(node) => {
                  poemCardRefs.current[index] = node
                }}
                className={`absolute opacity-0 ${
                  entry.variant === 'left-primary'
                    ? 'max-h-[60%] w-[68px] md:w-[84px]'
                    : entry.variant === 'left-secondary'
                      ? 'max-h-[56%] w-[60px] md:w-[76px]'
                      : 'max-h-[58%] w-[64px] md:w-[80px]'
                }`}
                style={entry.position}
              >
                <p className={`text-[10px] tracking-[0.24em] ${isLit ? 'text-[#f2f0e8]/72' : 'text-[#d9ddd7]/56'}`}>
                  {entry.label}
                </p>
                <p
                  className={`mt-2 font-semibold leading-[1.72] [text-shadow:0_2px_14px_rgba(0,0,0,0.46)] md:text-[22px] ${
                    entry.variant === 'left-primary'
                      ? 'text-[24px]'
                      : entry.variant === 'left-secondary'
                        ? 'text-[19px]'
                        : 'text-[21px]'
                  } ${isLit ? 'text-[#fbf8ef]' : 'text-[#ebe8df]/82'}`}
                  style={{
                    filter: 'url(#ink-poem-filter)',
                    writingMode: 'vertical-rl',
                  }}
                >
                  {entry.poem}
                </p>
                <p
                  className={`mt-3 text-[10px] tracking-[0.16em] ${
                    isLit ? 'text-[#eef1e7]/58' : 'text-[#d8ddd7]/44'
                  }`}
                >
                  {entry.note}
                </p>
              </div>
            ))}
          </div>

          <div className="relative z-20 mx-auto aspect-square w-full max-w-[min(62vw,68vh)] overflow-hidden rounded-[30px] shadow-[0_24px_72px_rgba(0,0,0,0.28)]">
            <img
              ref={colorImageRef}
              src="/assets/ink-color-bg.jpg"
              alt="点亮后的江南夜景"
              className="absolute inset-0 h-full w-full object-cover object-center"
              style={{ opacity: 0 }}
            />
            <img
              ref={darkImageRef}
              src="/assets/ink-dark-bg.jpg"
              alt="昏暗的江南夜景"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />

            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0)_32%,rgba(0,0,0,0.14))]" />
            <div
              ref={flashRef}
              className="pointer-events-none absolute inset-0 opacity-0"
              style={{
                background:
                  'radial-gradient(circle at 50% 38%, rgba(255,225,171,0.34) 0%, rgba(255,225,171,0.14) 14%, rgba(255,255,255,0.03) 28%, transparent 42%)',
                mixBlendMode: 'screen',
              }}
            />

            <button
              type="button"
              aria-label={clickCount >= POEMS.length ? '点灯进入下一幕' : '点亮画中的灯笼'}
              onClick={handleLanternClick}
              className="absolute left-1/2 top-[40%] z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition"
              style={{ width: '28%', height: '70%' }}
            >
              {clickCount === 0 ? (
                <div className="pointer-events-none absolute left-1/2 top-[30%] h-24 w-24 -translate-x-1/2 -translate-y-1/2">
                    <span className="lantern-guide-ring absolute inset-0 rounded-full border border-[#ffe7ae]/85" />
                    <span
                      className="lantern-guide-ring absolute inset-0 rounded-full border border-[#fff4d4]/72"
                      style={{ animationDelay: '0.35s' }}
                    />
                  </div>
              ) : null}
            </button>

            <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
              {clickCount >= POEMS.length ? (
                <div className="attention-float rounded-full border border-white/16 bg-[rgba(8,12,18,0.28)] px-5 py-2 text-xs tracking-[0.2em] text-[#f3efe5]/78 backdrop-blur-md">
                  三阙已成，可继续入园
                </div>
              ) : (
                <div className="attention-float rounded-full border border-white/16 bg-[rgba(8,12,18,0.24)] px-5 py-2 text-xs tracking-[0.18em] text-[#f3efe5]/74 backdrop-blur-md">
                  轻触画中灯笼，第 {clickCount + 1} 次唤醒诗句
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
