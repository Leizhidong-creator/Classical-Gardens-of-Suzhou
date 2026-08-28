import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { assetUrl } from '../assetUrl'

type GardenElement = {
  id: string
  label: string
  src: string
  x: number
  y: number
  width: number
  accent: string
}

type DragState = {
  id: string
  offsetX: number
  offsetY: number
} | null

const initialElements: GardenElement[] = [
  {
    id: 'pavilion',
    label: '亭台',
    src: assetUrl('element-pavilion.webp'),
    x: 46,
    y: 38,
    width: 22,
    accent: '#8bb7a2',
  },
  {
    id: 'banana-leaf',
    label: '芭蕉叶',
    src: assetUrl('芭蕉叶.webp'),
    x: 74,
    y: 44,
    width: 22,
    accent: '#6e9d62',
  },
  {
    id: 'rock-1',
    label: '太湖石一',
    src: assetUrl('element-taihu-rock（1）.webp'),
    x: 24,
    y: 58,
    width: 16,
    accent: '#778097',
  },
  {
    id: 'rock-2',
    label: '太湖石二',
    src: assetUrl('element-taihu-rock（2）.webp'),
    x: 68,
    y: 48,
    width: 17,
    accent: '#68758a',
  },
  {
    id: 'flora',
    label: '花木',
    src: assetUrl('element-flora.webp'),
    x: 74,
    y: 72,
    width: 18,
    accent: '#9eb88e',
  },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function Phase4Scene() {
  const sandboxRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<DragState>(null)
  const [elements, setElements] = useState<GardenElement[]>(initialElements)
  const [activeElementId, setActiveElementId] = useState<string>('pavilion')

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current
      const sandbox = sandboxRef.current

      if (!dragState || !sandbox) {
        return
      }

      const rect = sandbox.getBoundingClientRect()
      const nextX = clamp(
        ((event.clientX - rect.left) / rect.width) * 100 - dragState.offsetX,
        10,
        90,
      )
      const nextY = clamp(
        ((event.clientY - rect.top) / rect.height) * 100 - dragState.offsetY,
        12,
        88,
      )

      setElements((current) =>
        current.map((item) =>
          item.id === dragState.id
            ? {
                ...item,
                x: nextX,
                y: nextY,
              }
            : item,
        ),
      )
    }

    const handlePointerUp = () => {
      dragStateRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [])

  const sortedElements = useMemo(
    () => [...elements].sort((left, right) => left.y - right.y),
    [elements],
  )

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    element: GardenElement,
  ) => {
    const sandbox = sandboxRef.current

    if (!sandbox) {
      return
    }

    const rect = sandbox.getBoundingClientRect()
    const pointerX = ((event.clientX - rect.left) / rect.width) * 100
    const pointerY = ((event.clientY - rect.top) / rect.height) * 100

    dragStateRef.current = {
      id: element.id,
      offsetX: pointerX - element.x,
      offsetY: pointerY - element.y,
    }

    setActiveElementId(element.id)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#edf1eb] text-yuan-shan-dai">
      <div
        className="absolute inset-0 scale-[1.03] bg-cover bg-center bg-no-repeat opacity-[0.98]"
        style={{
          backgroundImage: `url("${assetUrl('第四幕大背景.webp')}")`,
          filter: 'saturate(1.08) contrast(1.08) brightness(0.94)',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.08),transparent_24%),linear-gradient(180deg,rgba(14,18,20,0.08),rgba(14,18,20,0.02)_36%,rgba(14,18,20,0.16))]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-24 lg:px-6 lg:py-24">
        <div className="grid min-h-[calc(100vh-10rem)] gap-4 xl:grid-cols-[280px_minmax(500px,0.9fr)_360px]">
          <aside className="flex flex-col rounded-[32px] border border-white/16 bg-transparent p-6 shadow-[0_18px_40px_rgba(31,37,45,0.08)]">
            <div>
              <span className="inline-flex rounded-full border border-tian-shui-bi/28 bg-tian-shui-bi/10 px-4 py-1 text-[12px] tracking-[0.36em] text-[rgba(97,122,113,0.98)]">
                PHASE 4
              </span>
              <div className="mt-5">
                <span className="inline-flex rounded-full border border-white/62 bg-[rgba(255,255,255,0.46)] px-6 py-3 text-4xl font-semibold tracking-[0.16em] text-mo-qing shadow-[0_14px_28px_rgba(0,0,0,0.10)] backdrop-blur-md">
                  园林设计师
                </span>
              </div>
              <p className="mt-5 text-[17px] leading-9 text-[rgba(61,70,75,0.96)]">
                拖拽亭台、芭蕉叶、花木与两组太湖石，快速组合属于你的花窗园景。
              </p>
            </div>

            <div className="mt-5 rounded-[28px] border border-[rgba(221,225,218,0.62)] bg-[rgba(248,245,238,0.32)] p-4 backdrop-blur-sm">
              <p className="text-[14px] font-medium tracking-[0.28em] text-[rgba(24,28,32,0.98)]">元素库</p>
              <div className="mt-4 flex flex-col gap-3">
                {elements.map((element) => {
                  const isActive = activeElementId === element.id

                  return (
                    <button
                      key={element.id}
                      type="button"
                      className={`flex items-center gap-4 rounded-[22px] border px-4 py-3 text-left transition duration-300 ${
                        isActive
                          ? 'border-tian-shui-bi/40 bg-[rgba(126,177,144,0.12)]'
                          : 'border-[#d7dfda] bg-[rgba(255,251,246,0.22)] hover:border-tian-shui-bi/30 hover:bg-[rgba(255,251,246,0.3)]'
                      }`}
                      onClick={() => setActiveElementId(element.id)}
                    >
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: `${element.accent}1f` }}
                      >
                        <img src={element.src} alt="" aria-hidden="true" className="h-9 w-9 object-contain" />
                      </div>
                      <div>
                        <p className="text-[18px] font-medium tracking-[0.08em] text-[rgba(52,60,66,0.98)]">
                          {element.label}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>

          <section className="rounded-[36px] border border-white/14 bg-transparent p-4 shadow-[0_32px_80px_rgba(31,37,45,0.12)]">
            <div className="flex h-full min-h-[560px] flex-col rounded-[32px] border border-[rgba(215,223,218,0.24)] bg-transparent p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs tracking-[0.32em] text-tian-shui-bi">俯视沙盘</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <h3 className="whitespace-nowrap text-[28px] font-semibold tracking-[0.08em] text-mo-qing">
                      层景生趣
                    </h3>
                    <span className="rounded-full border border-white/42 bg-[rgba(18,26,32,0.3)] px-3 py-1.5 text-[12px] font-black tracking-[0.12em] text-white shadow-[0_8px_18px_rgba(0,0,0,0.12)] backdrop-blur-md">
                      拖动图标，自由移动
                    </span>
                    <span className="rounded-full border border-white/42 bg-[rgba(18,26,32,0.28)] px-3 py-1 text-[12px] font-black tracking-[0.12em] text-white shadow-[0_8px_18px_rgba(0,0,0,0.12)] backdrop-blur-md">
                      近大远小
                    </span>
                  </div>
                </div>
                <div className="rounded-full border border-white/54 bg-[rgba(255,248,240,0.42)] px-4 py-2 text-xs tracking-[0.18em] text-yuan-shan-dai/88 backdrop-blur-md">
                  拖动元素调整景别
                </div>
              </div>

              <div
                ref={sandboxRef}
                className="relative mt-5 h-[470px] touch-none overflow-hidden rounded-[30px] border border-white/85 bg-[radial-gradient(circle_at_top,rgba(248,245,238,0.26),rgba(232,237,230,0.16)_48%,rgba(209,218,212,0.2))] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.72),0_0_0_1px_rgba(255,255,255,0.22)] lg:h-[500px]"
              >
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(81,88,106,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(81,88,106,0.04)_1px,transparent_1px)] bg-[length:72px_72px]" />
                <div className="pointer-events-none absolute inset-3 rounded-[28px] border border-white/82" />
                <div className="pointer-events-none absolute inset-6 rounded-[28px] border border-dashed border-[rgba(255,255,255,0.58)]" />
                <div className="pointer-events-none absolute left-[12%] top-[14%] h-24 w-24 rounded-full bg-[rgba(139,183,162,0.12)] blur-2xl" />
                <div className="pointer-events-none absolute bottom-[16%] right-[18%] h-28 w-28 rounded-full bg-[rgba(81,88,106,0.1)] blur-3xl" />

                {sortedElements.map((element) => {
                  const isActive = activeElementId === element.id

                  return (
                    <button
                      key={element.id}
                      type="button"
                      className={`absolute touch-none select-none ${isActive ? 'z-30' : 'z-20'}`}
                      style={{
                        left: `${element.x}%`,
                        top: `${element.y}%`,
                        width: `${element.width}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onPointerDown={(event) => handlePointerDown(event, element)}
                      onClick={() => setActiveElementId(element.id)}
                    >
                      <div
                        className={`rounded-[26px] border bg-[rgba(255,250,245,0.46)] p-3 shadow-[0_16px_32px_rgba(31,37,45,0.14)] backdrop-blur-md transition duration-200 ${
                          isActive ? 'border-white/90 ring-2 ring-tian-shui-bi/35' : 'border-white/70 hover:border-tian-shui-bi/35'
                        }`}
                        style={{
                          boxShadow: isActive
                            ? `0 18px 42px ${element.accent}33`
                            : '0 18px 36px rgba(31,37,45,0.12)',
                        }}
                      >
                        <img
                          src={element.src}
                          alt={element.label}
                          draggable={false}
                          className="pointer-events-none h-auto w-full object-contain"
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          <aside className="rounded-[36px] border border-white/14 bg-transparent p-4 shadow-[0_18px_40px_rgba(31,37,45,0.08)]">
            <div className="flex h-full min-h-[560px] flex-col rounded-[32px] border border-[rgba(215,223,218,0.24)] bg-transparent p-5">
              <div>
                <p className="text-xs tracking-[0.32em] text-tian-shui-bi">花窗视角</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-[0.14em] text-mo-qing">窗中成景</h3>
              </div>

              <div className="relative mt-5 h-[470px] overflow-hidden rounded-[34px] border border-[#d7dfda] bg-[#d7ddd7] lg:h-[500px]">
                <img
                  src={assetUrl('水墨背景.webp?v=20260426-unified-ink')}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
                />

                <div
                  className="pointer-events-none absolute z-10 overflow-hidden"
                  style={{
                    left: '2.8%',
                    right: '2.8%',
                    top: '1.2%',
                    bottom: '1.2%',
                    clipPath:
                      'polygon(17% 7%, 83% 7%, 89% 13%, 89% 79%, 75% 94%, 56% 100%, 44% 100%, 25% 94%, 11% 79%, 11% 13%)',
                  }}
                >
                  {sortedElements.map((element) => {
                    const depth = element.y / 100
                    const previewScale = 0.48 + depth * 0.92
                    const previewLeft = 10 + element.x * 0.8
                    const previewBottom = 8 + depth * 38
                    const blur = Math.max(0, 1.2 - depth * 0.95)
                    const opacity = 0.72 + depth * 0.24
                    const isActive = activeElementId === element.id

                    return (
                      <div
                        key={element.id}
                        className="absolute transition-all duration-200"
                        style={{
                          left: `${previewLeft}%`,
                          bottom: `${previewBottom}%`,
                          width: `${element.width * 2.45}%`,
                          transform: `translateX(-50%) scale(${previewScale})`,
                          zIndex: Math.round(depth * 100) + (isActive ? 100 : 0),
                          opacity,
                          filter: `blur(${blur}px) drop-shadow(0 12px 24px rgba(20, 28, 34, 0.18))`,
                        }}
                      >
                        <img
                          src={element.src}
                          alt=""
                          aria-hidden="true"
                          draggable={false}
                          className="h-auto w-full object-contain"
                        />
                      </div>
                    )
                  })}
                </div>

                <img
                  src={assetUrl('背景花窗.webp')}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-[300] h-full w-full object-cover"
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
