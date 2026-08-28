import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { assetUrl } from '../assetUrl'

type Point = {
  x: number
  y: number
}

type Phase1SceneProps = {
  onContinue: () => void
}

const SAMPLE_GAP = 12
const WATER_DROPLET_COUNT = 140
const WATER_STREAK_COUNT = 32
const BRUSH_LINE_WIDTH = 100
const REVEAL_THRESHOLD = 0.3
const AUTO_CONTINUE_DELAY = 2000

function createSeededRandom(seed: number) {
  let value = seed

  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296
    return value / 4294967296
  }
}

export function Phase1Scene({ onContinue }: Phase1SceneProps) {
  const sceneCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const mistCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const guideCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const clearGardenImageRef = useRef<HTMLImageElement | null>(null)
  const windowFrameImageRef = useRef<HTMLImageElement | null>(null)
  const openingMaskCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const openingMaskAlphaRef = useRef<Uint8ClampedArray | null>(null)
  const lastPointRef = useRef<Point | null>(null)
  const isErasingRef = useRef(false)
  const activePointerIdRef = useRef<number | null>(null)
  const hasMovedRef = useRef(false)

  const [, setScratchedRatio] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const shouldShowRevealNotice = isRevealed && hasUserInteracted

  const loadImage = useCallback((src: string) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error(`Failed to load image: ${src}`))
      image.src = src
    })
  }, [])

  const drawImageCover = useCallback(
    (context: CanvasRenderingContext2D, image: HTMLImageElement, targetWidth: number, targetHeight: number) => {
      const imageRatio = image.width / image.height
      const targetRatio = targetWidth / targetHeight

      const drawWidth = imageRatio > targetRatio ? targetHeight * imageRatio : targetWidth
      const drawHeight = imageRatio > targetRatio ? targetHeight : targetWidth / imageRatio
      const offsetX = imageRatio > targetRatio ? (targetWidth - drawWidth) / 2 : 0
      const offsetY = imageRatio > targetRatio ? 0 : (targetHeight - drawHeight) / 2

      context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)
    },
    [],
  )

  const rebuildOpeningMask = useCallback(() => {
    const windowFrameImage = windowFrameImageRef.current

    if (!windowFrameImage) {
      return false
    }

    const width = window.innerWidth
    const height = window.innerHeight
    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = width
    maskCanvas.height = height

    const maskContext = maskCanvas.getContext('2d')

    if (!maskContext) {
      return false
    }

    maskContext.clearRect(0, 0, width, height)
    drawImageCover(maskContext, windowFrameImage, width, height)

    const imageData = maskContext.getImageData(0, 0, width, height)
    const { data } = imageData

    for (let index = 0; index < data.length; index += 4) {
      const red = data[index]
      const green = data[index + 1]
      const blue = data[index + 2]
      const alpha = data[index + 3]
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722
      const isWindowOpening = alpha > 0 && luminance >= 242
      const nextAlpha = isWindowOpening ? 255 : 0

      data[index] = 255
      data[index + 1] = 255
      data[index + 2] = 255
      data[index + 3] = nextAlpha
    }

    maskContext.putImageData(imageData, 0, 0)
    openingMaskCanvasRef.current = maskCanvas
    openingMaskAlphaRef.current = imageData.data
    return true
  }, [drawImageCover])

  const drawSceneLayer = useCallback(() => {
    const canvas = sceneCanvasRef.current
    const clearGardenImage = clearGardenImageRef.current
    const openingMaskCanvas = openingMaskCanvasRef.current

    if (!canvas || !clearGardenImage || !openingMaskCanvas) {
      return
    }

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    const width = canvas.width
    const height = canvas.height
    context.clearRect(0, 0, width, height)
    drawImageCover(context, clearGardenImage, width, height)
    context.globalCompositeOperation = 'destination-in'
    context.drawImage(openingMaskCanvas, 0, 0)
    context.globalCompositeOperation = 'source-over'
  }, [drawImageCover])

  const drawGuideFrame = useCallback(
    (timestamp: number) => {
      const canvas = guideCanvasRef.current
      const clearGardenImage = clearGardenImageRef.current

      if (!canvas || !clearGardenImage || hasUserInteracted || isRevealed) {
        if (canvas) {
          const idleContext = canvas.getContext('2d')
          idleContext?.clearRect(0, 0, canvas.width, canvas.height)
        }
        return
      }

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }

      const context = canvas.getContext('2d')

      if (!context) {
        return
      }

      const width = canvas.width
      const height = canvas.height
      const shortSide = Math.min(width, height)
      const cycleDuration = 2600
      const progress = (timestamp % cycleDuration) / cycleDuration
      const swingProgress = 0.5 - Math.cos(progress * Math.PI * 2) / 2
      const trackHalfWidth = Math.min(width * 0.12, 120)
      const guideRadius = Math.min(shortSide * 0.075, 66)
      const centerX = width / 2
      const centerY = height * 0.5
      const guideX = centerX - trackHalfWidth + trackHalfWidth * 2 * swingProgress

      context.clearRect(0, 0, width, height)

      context.save()
      context.strokeStyle = 'rgba(255,255,255,0.28)'
      context.lineWidth = Math.max(6, shortSide * 0.008)
      context.lineCap = 'round'
      context.beginPath()
      context.moveTo(centerX - trackHalfWidth, centerY)
      context.lineTo(centerX + trackHalfWidth, centerY)
      context.stroke()
      context.restore()

      context.save()
      context.beginPath()
      context.arc(guideX, centerY, guideRadius, 0, Math.PI * 2)
      context.clip()
      drawImageCover(context, clearGardenImage, width, height)
      context.fillStyle = 'rgba(255,255,255,0.16)'
      context.fillRect(0, 0, width, height)
      context.restore()

      context.save()
      context.beginPath()
      context.arc(guideX, centerY, guideRadius, 0, Math.PI * 2)
      context.fillStyle = 'rgba(245,248,251,0.18)'
      context.shadowColor = 'rgba(255,255,255,0.22)'
      context.shadowBlur = 18
      context.fill()
      context.lineWidth = 2.4
      context.strokeStyle = 'rgba(255,255,255,0.62)'
      context.stroke()
      context.restore()

      context.save()
      context.strokeStyle = 'rgba(255,255,255,0.72)'
      context.lineWidth = 3
      context.lineCap = 'round'
      const arrowOffset = guideRadius * 0.26
      context.beginPath()
      context.moveTo(guideX - arrowOffset, centerY)
      context.lineTo(guideX + arrowOffset, centerY)
      context.moveTo(guideX + arrowOffset, centerY)
      context.lineTo(guideX + arrowOffset - 10, centerY - 8)
      context.moveTo(guideX + arrowOffset, centerY)
      context.lineTo(guideX + arrowOffset - 10, centerY + 8)
      context.stroke()
      context.restore()
    },
    [drawImageCover, hasUserInteracted, isRevealed],
  )

  const drawMistLayer = useCallback(() => {
    const canvas = mistCanvasRef.current
    const openingMaskCanvas = openingMaskCanvasRef.current

    if (!canvas || !openingMaskCanvas) {
      return
    }

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    const internalWidth = window.innerWidth
    const internalHeight = window.innerHeight
    context.clearRect(0, 0, internalWidth, internalHeight)
    context.globalCompositeOperation = 'source-over'
    context.fillStyle = 'rgba(236, 240, 242, 0.54)'
    context.fillRect(0, 0, internalWidth, internalHeight)

    const fogRandom = createSeededRandom(20260425)
    const shortSide = Math.min(internalWidth, internalHeight)

    for (let index = 0; index < 28; index += 1) {
      const fogRadius = shortSide * (0.14 + fogRandom() * 0.21)
      const fogX = fogRandom() * internalWidth
      const fogY = fogRandom() * internalHeight
      const fogGradient = context.createRadialGradient(fogX, fogY, 0, fogX, fogY, fogRadius)

      fogGradient.addColorStop(0, `rgba(255,255,255,${0.09 + fogRandom() * 0.08})`)
      fogGradient.addColorStop(0.58, 'rgba(255,255,255,0.045)')
      fogGradient.addColorStop(1, 'rgba(255,255,255,0)')
      context.fillStyle = fogGradient
      context.fillRect(fogX - fogRadius, fogY - fogRadius, fogRadius * 2, fogRadius * 2)
    }

    for (let index = 0; index < WATER_DROPLET_COUNT; index += 1) {
      const radius = shortSide * (0.0036 + fogRandom() * 0.01)
      const stretch = 0.76 + fogRandom() * 0.62
      const x = fogRandom() * internalWidth
      const y = fogRandom() * internalHeight

      context.save()
      context.translate(x, y)
      context.rotate((fogRandom() - 0.5) * 0.22)

      context.fillStyle = 'rgba(92, 108, 122, 0.08)'
      context.beginPath()
      context.ellipse(radius * 0.1, radius * 0.22, radius * stretch * 1.02, radius * 1.05, 0, 0, Math.PI * 2)
      context.fill()

      const dropletBody = context.createRadialGradient(
        -radius * 0.34,
        -radius * 0.42,
        radius * 0.08,
        0,
        0,
        radius * 1.15,
      )

      dropletBody.addColorStop(0, 'rgba(255,255,255,0.72)')
      dropletBody.addColorStop(0.34, 'rgba(255,255,255,0.28)')
      dropletBody.addColorStop(0.72, 'rgba(188,203,214,0.1)')
      dropletBody.addColorStop(1, 'rgba(255,255,255,0)')
      context.fillStyle = dropletBody
      context.beginPath()
      context.ellipse(0, 0, radius * stretch, radius, 0, 0, Math.PI * 2)
      context.fill()

      context.strokeStyle = 'rgba(134, 151, 166, 0.18)'
      context.lineWidth = Math.max(0.8, radius * 0.12)
      context.beginPath()
      context.ellipse(0, 0, radius * stretch, radius, 0, 0, Math.PI * 2)
      context.stroke()

      context.fillStyle = 'rgba(255,255,255,0.58)'
      context.beginPath()
      context.ellipse(-radius * 0.34, -radius * 0.34, radius * 0.18, radius * 0.08, 0, 0, Math.PI * 2)
      context.fill()

      context.restore()
    }

    for (let index = 0; index < WATER_STREAK_COUNT; index += 1) {
      const streakX = fogRandom() * internalWidth
      const streakY = fogRandom() * internalHeight
      const streakWidth = shortSide * (0.002 + fogRandom() * 0.004)
      const streakHeight = shortSide * (0.028 + fogRandom() * 0.07)

      context.save()
      context.translate(streakX, streakY)
      context.rotate((fogRandom() - 0.5) * 0.08)
      const streakGradient = context.createLinearGradient(0, -streakHeight / 2, 0, streakHeight / 2)

      streakGradient.addColorStop(0, 'rgba(255,255,255,0)')
      streakGradient.addColorStop(0.22, 'rgba(255,255,255,0.05)')
      streakGradient.addColorStop(0.58, 'rgba(255,255,255,0.18)')
      streakGradient.addColorStop(1, 'rgba(255,255,255,0)')
      context.fillStyle = streakGradient
      context.beginPath()
      context.ellipse(0, 0, streakWidth, streakHeight, 0, 0, Math.PI * 2)
      context.fill()
      context.restore()
    }

    context.save()
    context.globalCompositeOperation = 'destination-in'
    context.drawImage(openingMaskCanvas, 0, 0)
    context.restore()

    lastPointRef.current = null
    isErasingRef.current = false
    activePointerIdRef.current = null
    hasMovedRef.current = false
    setScratchedRatio(0)
    setIsRevealed(false)
  }, [])

  useEffect(() => {
    let cancelled = false

    const initializeLayers = async () => {
      const [clearGardenImage, windowFrameImage] = await Promise.all([
        loadImage(assetUrl('bg-clear-garden.webp')),
        loadImage(assetUrl('window-frame-mask.png')),
      ])

      if (cancelled) {
        return
      }

      clearGardenImageRef.current = clearGardenImage
      windowFrameImageRef.current = windowFrameImage

      if (!rebuildOpeningMask()) {
        return
      }

      drawSceneLayer()
      drawMistLayer()
    }

    void initializeLayers()

    const handleResize = () => {
      if (!rebuildOpeningMask()) {
        return
      }

      drawSceneLayer()
      drawMistLayer()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelled = true
      window.removeEventListener('resize', handleResize)
    }
  }, [drawMistLayer, drawSceneLayer, loadImage, rebuildOpeningMask])

  useEffect(() => {
    let animationFrameId = 0

    const animateGuide = (timestamp: number) => {
      drawGuideFrame(timestamp)
      animationFrameId = window.requestAnimationFrame(animateGuide)
    }

    if (!hasUserInteracted && !isRevealed) {
      animationFrameId = window.requestAnimationFrame(animateGuide)
    } else if (guideCanvasRef.current) {
      const context = guideCanvasRef.current.getContext('2d')
      context?.clearRect(0, 0, guideCanvasRef.current.width, guideCanvasRef.current.height)
    }

    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [drawGuideFrame, hasUserInteracted, isRevealed])

  useEffect(() => {
    if (!shouldShowRevealNotice) {
      return
    }

    const timer = window.setTimeout(() => {
      onContinue()
    }, AUTO_CONTINUE_DELAY)

    return () => {
      window.clearTimeout(timer)
    }
  }, [onContinue, shouldShowRevealNotice])

  const isPointInsideWindow = useCallback((point: Point) => {
    const canvas = mistCanvasRef.current
    const openingMaskAlpha = openingMaskAlphaRef.current

    if (!canvas || !openingMaskAlpha) {
      return false
    }

    const x = Math.max(0, Math.min(canvas.width - 1, Math.round(point.x)))
    const y = Math.max(0, Math.min(canvas.height - 1, Math.round(point.y)))
    const alphaIndex = (y * canvas.width + x) * 4 + 3
    return openingMaskAlpha[alphaIndex] > 0
  }, [])

  const computeErasedRatio = useCallback(() => {
    const canvas = mistCanvasRef.current
    const openingMaskAlpha = openingMaskAlphaRef.current

    if (!canvas || !openingMaskAlpha) {
      return 0
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return 0
    }

    const { width, height } = canvas
    const imageData = context.getImageData(0, 0, width, height).data
    let transparentCount = 0
    let totalCount = 0

    for (let y = 0; y < height; y += SAMPLE_GAP) {
      for (let x = 0; x < width; x += SAMPLE_GAP) {
        const alphaIndex = (y * width + x) * 4 + 3

        if (openingMaskAlpha[alphaIndex] === 0) {
          continue
        }

        totalCount += 1

        if (imageData[alphaIndex] === 0) {
          transparentCount += 1
        }
      }
    }

    return totalCount === 0 ? 0 : transparentCount / totalCount
  }, [])

  const eraseMist = useCallback(
    (point: Point, shouldErase: boolean) => {
      if (isRevealed || !shouldErase) {
        return
      }

      const canvas = mistCanvasRef.current

      if (!canvas) {
        return
      }

      const context = canvas.getContext('2d')

      if (!context) {
        return
      }

      const previousPoint = lastPointRef.current

      lastPointRef.current = point
      hasMovedRef.current = true

      if (!isPointInsideWindow(point)) {
        return
      }

      if (!previousPoint) {
        return
      }

      context.save()
      context.globalCompositeOperation = 'destination-out'
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.strokeStyle = 'rgba(0,0,0,1)'
      context.lineWidth = BRUSH_LINE_WIDTH
      context.beginPath()
      context.moveTo(previousPoint.x, previousPoint.y)
      context.lineTo(point.x, point.y)
      context.stroke()
      context.restore()

      const nextRatio = computeErasedRatio()
      setScratchedRatio(nextRatio)

      if (nextRatio >= REVEAL_THRESHOLD) {
        setHasUserInteracted(true)
        setIsRevealed(true)
      }
    },
    [computeErasedRatio, isPointInsideWindow, isRevealed],
  )

  const toCanvasPoint = (clientX: number, clientY: number): Point | null => {
    const canvas = mistCanvasRef.current

    if (!canvas) {
      return null
    }

    const rect = canvas.getBoundingClientRect()
    const offsetX = clientX - rect.left
    const offsetY = clientY - rect.top

    if (offsetX < 0 || offsetY < 0 || offsetX > rect.width || offsetY > rect.height) {
      return null
    }

    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: offsetX * scaleX,
      y: offsetY * scaleY,
    }
  }

  const resetTrail = () => {
    lastPointRef.current = null
    isErasingRef.current = false
    activePointerIdRef.current = null
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const point = toCanvasPoint(event.clientX, event.clientY)

    if (!point || !isPointInsideWindow(point)) {
      resetTrail()
      return
    }

    setHasUserInteracted(true)
    isErasingRef.current = true
    activePointerIdRef.current = event.pointerId
    event.currentTarget.setPointerCapture(event.pointerId)
    lastPointRef.current = point
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isErasingRef.current || activePointerIdRef.current !== event.pointerId) {
      return
    }

    const point = toCanvasPoint(event.clientX, event.clientY)

    if (!point || !isPointInsideWindow(point)) {
      lastPointRef.current = null
      return
    }

    eraseMist(point, true)
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black touch-none text-white">
      <img
        src={assetUrl('window-frame-mask.png')}
        alt="花窗与原始背景"
        className="absolute inset-0 z-0 h-full w-full object-cover object-center"
      />

      <canvas
        ref={sceneCanvasRef}
        className="pointer-events-none absolute inset-0 z-10 h-full w-full object-cover object-center"
      />

      <canvas
        ref={mistCanvasRef}
        className={`absolute inset-0 z-20 h-full w-full object-cover object-center touch-none cursor-grab transition-all duration-[1400ms] active:cursor-grabbing ${
          isRevealed ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={resetTrail}
        onPointerCancel={resetTrail}
        onPointerLeave={resetTrail}
      />

      <canvas
        ref={guideCanvasRef}
        className={`pointer-events-none absolute inset-0 z-[25] h-full w-full object-cover object-center transition-opacity duration-500 ${
          hasUserInteracted || isRevealed ? 'opacity-0' : 'opacity-100'
        }`}
      />

      <div
        className={`pointer-events-none absolute inset-x-0 top-1/2 z-[26] flex -translate-y-[-6.5rem] justify-center px-4 transition-all duration-500 ${
          hasUserInteracted || isRevealed ? 'translate-y-[-5.5rem] opacity-0' : 'translate-y-[-6.5rem] opacity-100'
        }`}
      >
        <div className="rounded-full border border-white/28 bg-[rgba(9,14,18,0.34)] px-5 py-2 text-[12px] tracking-[0.26em] text-white/88 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-md">
          左右滑动，擦开晨雾
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-10 z-30 flex flex-col items-center px-4">
        <div
          className={`rounded-[28px] border border-white/20 bg-[rgba(8,12,16,0.32)] px-6 py-5 text-center shadow-[0_28px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-700 ${
            shouldShowRevealNotice ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <span className="text-[11px] tracking-[0.4em] text-white/72">瞬间一 · 破雾寻幽</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-[0.18em] text-white md:text-4xl">
            花窗之外，园林浪漫
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-8 text-white/80 md:text-base">
            雾意退尽，窗中园景尽数显现。片刻驻足之后，画面将自动带你进入下一幕。
          </p>
        </div>
      </div>
    </div>
  )
}
