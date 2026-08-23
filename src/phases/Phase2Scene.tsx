import { Center, Html, OrbitControls, useGLTF, useProgress } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { Group, Mesh, MeshStandardMaterial, Object3D } from 'three'

type TagItem = {
  id: string
  name: string
  position: [number, number, number]
  description: string
}

type TagsPayload = {
  metadata: {
    model_name: string
    model_type: string
    style: string
    description: string
  }
  tags: TagItem[]
}

type Phase2SceneProps = {
  onContinue: () => void
}

type ScenicModelId = 'suzhou-pavilion' | 'ta-ying-ting' | 'hu-xin-ting'

type ScenicModelConfig = {
  id: ScenicModelId
  name: string
  location: string
  badge: string
  assetPath: string
  shortIntro: string
  description: string
  style: string
  supportsHotspots: boolean
  sceneScale: number
  scenePosition: [number, number, number]
  cameraPosition: [number, number, number]
  controlsTarget: [number, number, number]
}

type PavilionSceneProps = {
  model: ScenicModelConfig
  tags: TagItem[]
  activeTagId: string | null
  onSelectTag: (tag: TagItem | null) => void
}

const COMPACT_TAG_SUMMARIES: Record<string, string> = {
  baoding: '亭顶吉祥装饰',
  feiyan: '屋角轻翘飞檐',
  zanjianding: '亭子攒尖屋顶',
  zuoqianzhu: '前侧承重柱',
  youqianzhu: '前侧承重柱',
  zuohouzhu: '后侧承重柱',
  youhouzhu: '后侧承重柱',
  taiji: '抬高防潮基座',
  langan: '亭边围护栏杆',
  wuji: '屋顶交汇脊线',
  gualuo: '柱间镂空饰件',
}

const PHASE2_BG_IMAGE = "/assets/模块二背景图.webp?v=20260426-strong-garden"

const MODEL_OPTIONS: ScenicModelConfig[] = [
  {
    id: 'suzhou-pavilion',
    name: '苏州园林四角亭',
    location: '苏州园林',
    badge: '部位可点读',
    assetPath: '/assets/suzhou-pavilion.glb',
    shortIntro: '可点构件讲解',
    description:
      '这座四角亭以攒尖屋顶、立柱与台基组成完整的江南亭榭原型，适合从整体到局部观察苏州园林亭类建筑的构造秩序与轻巧尺度。',
    style: '苏州古典园林微缩建筑',
    supportsHotspots: true,
    sceneScale: 2.08,
    scenePosition: [0, 0.32, 0],
    cameraPosition: [2.05, 1.12, 3.4],
    controlsTarget: [0, 0.46, 0],
  },
  {
    id: 'ta-ying-ting',
    name: '拙政园塔影亭',
    location: '苏州拙政园',
    badge: '整体导览',
    assetPath: '/assets/1.glb',
    shortIntro: '临水八角小亭',
    description:
      '塔影亭位于拙政园西园南端，临溪而筑，亭影常与水面倒影相映成趣。它以八角攒尖顶和轻巧的临水姿态收束西园景序，兼具借景、映景与曲终余韵的园林意境。',
    style: '拙政园经典水亭',
    supportsHotspots: false,
    sceneScale: 1.8,
    scenePosition: [0, 0.36, 0],
    cameraPosition: [2.18, 1.16, 3.6],
    controlsTarget: [0, 0.44, 0],
  },
  {
    id: 'hu-xin-ting',
    name: '西湖湖心亭',
    location: '杭州西湖',
    badge: '整体导览',
    assetPath: '/assets/2.glb',
    shortIntro: '湖上赏景名亭',
    description:
      '湖心亭位于杭州西湖湖心区域，是西湖最具代表性的湖上亭景之一。它四面临水，长于观湖、听雨与远眺群山，展现了江南水上亭台开阔、清远而富于文人气息的景观特征。',
    style: '西湖湖上亭景',
    supportsHotspots: false,
    sceneScale: 1.6,
    scenePosition: [0, 0.4, 0],
    cameraPosition: [2.24, 1.14, 3.78],
    controlsTarget: [0, 0.43, 0],
  },
]

function ModelAsset({ assetPath }: { assetPath: string }) {
  const { scene } = useGLTF(assetPath)
  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true)

    cloned.traverse((child: Object3D) => {
      const mesh = child as Mesh

      if (!mesh.isMesh || !mesh.material) {
        return
      }

      const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      const clonedMaterials = sourceMaterials.map((material) => material.clone())

      mesh.material = Array.isArray(mesh.material) ? clonedMaterials : clonedMaterials[0]

      clonedMaterials.forEach((material) => {
        const standardMaterial = material as MeshStandardMaterial

        if ('color' in standardMaterial && standardMaterial.color) {
          standardMaterial.color.multiplyScalar(1.08)
        }

        if ('emissive' in standardMaterial && standardMaterial.emissive) {
          standardMaterial.emissiveIntensity = Math.max(standardMaterial.emissiveIntensity ?? 0, 0.14)
        }

        if ('roughness' in standardMaterial && typeof standardMaterial.roughness === 'number') {
          standardMaterial.roughness = Math.max(0.35, standardMaterial.roughness * 0.92)
        }

        if ('metalness' in standardMaterial && typeof standardMaterial.metalness === 'number') {
          standardMaterial.metalness = Math.min(0.18, standardMaterial.metalness)
        }

        material.needsUpdate = true
      })
    })

    return cloned
  }, [scene])

  return <primitive object={clonedScene} />
}

function CanvasLoadingOverlay() {
  const { progress } = useProgress()

  return (
    <Html center>
      <div className="min-w-[180px] rounded-[26px] border border-white/30 bg-[rgba(18,26,32,0.72)] px-5 py-4 text-center text-white shadow-[0_24px_48px_rgba(0,0,0,0.28)] backdrop-blur-md">
        <p className="text-[10px] tracking-[0.3em] text-white/68">模型加载中</p>
        <p className="mt-3 text-2xl font-semibold tracking-[0.14em]">{Math.round(progress)}%</p>
      </div>
    </Html>
  )
}

function PavilionScene({
  model,
  tags,
  activeTagId,
  onSelectTag,
}: PavilionSceneProps) {
  const groupRef = useRef<Group | null>(null)
  const activeTag = tags.find((tag) => tag.id === activeTagId) ?? null
  const guideTag = !activeTag && tags.length > 0 ? tags[0] : null
  const currentTag = activeTag ?? guideTag
  const cardAlign = currentTag ? (currentTag.position[0] > 0.08 ? 'left' : 'right') : 'right'
  const compactSummary = activeTag ? COMPACT_TAG_SUMMARIES[activeTag.id] ?? activeTag.description : ''

  const handleModelPointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()

    const group = groupRef.current

    if (!group) {
      return
    }

    const localPoint = group.worldToLocal(event.point.clone())
    let nearestTag: TagItem | null = null
    let nearestDistance = Number.POSITIVE_INFINITY

    tags.forEach((tag) => {
      const dx = localPoint.x - tag.position[0]
      const dy = localPoint.y - tag.position[1]
      const dz = localPoint.z - tag.position[2]
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestTag = tag
      }
    })

    onSelectTag(nearestDistance <= 0.25 ? nearestTag : null)
  }

  return (
    <>
      <ambientLight intensity={1.5} color="#f8f5ee" />
      <hemisphereLight intensity={0.95} color="#fff6df" groundColor="#8db299" />
      <directionalLight position={[3, 4, 3]} intensity={2.45} color="#fffaf1" />
      <directionalLight position={[-2, 1.4, -3]} intensity={1.18} color="#b7d7c8" />
      <directionalLight position={[0, 2.6, 4]} intensity={1.12} color="#ffffff" />
      <spotLight
        position={[0, 3.4, 1.8]}
        angle={0.38}
        intensity={18}
        penumbra={0.6}
        color="#fdf4dc"
      />

      <group ref={groupRef} scale={model.sceneScale} position={model.scenePosition} onPointerDown={handleModelPointerDown}>
        <ModelAsset assetPath="/assets/suzhou-pavilion.glb" />
        {currentTag ? (
          <Html
            position={currentTag.position}
            occlude={false}
            transform={false}
            zIndexRange={[120, 0]}
          >
            <div className="pointer-events-none relative">
              <span className="absolute left-0 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-[#d84b44] shadow-[0_0_14px_rgba(216,75,68,0.55)]" />
              <span
                className={`absolute top-0 h-[1.5px] -translate-y-1/2 bg-[#d84b44]/85 ${
                  cardAlign === 'right' ? 'left-[6px] w-6' : 'right-[6px] w-6'
                }`}
              />
              <div
                className={`absolute top-0 rounded-[12px] border border-white/28 bg-[rgba(98,109,124,0.88)] px-2.5 py-2 text-white shadow-[0_10px_22px_rgba(0,0,0,0.18)] backdrop-blur-xl ${
                  activeTag ? 'w-[92px]' : 'w-[128px]'
                } ${cardAlign === 'right' ? 'left-[1.45rem] -translate-y-[18%]' : 'right-[1.45rem] -translate-y-[18%]'}`}
              >
                <h4 className="text-[10px] font-black tracking-[0.02em] text-white">{currentTag.name}</h4>
                {activeTag ? (
                  <p
                    className="mt-0.5 text-[7px] leading-[1.2] text-white/80"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {compactSummary}
                  </p>
                ) : (
                  <p className="mt-0.5 text-[8px] font-semibold leading-[1.25] text-white/92">点击模型查看细节</p>
                )}
              </div>
            </div>
          </Html>
        ) : null}
      </group>

      <OrbitControls
        makeDefault
        enablePan={false}
        target={model.controlsTarget}
        minDistance={1.1}
        maxDistance={8.8}
        maxPolarAngle={Math.PI * 0.52}
        minPolarAngle={Math.PI * 0.18}
        autoRotate
        autoRotateSpeed={0.45}
      />
    </>
  )
}

function ScenicModelScene({ model }: { model: ScenicModelConfig }) {
  return (
    <>
      <ambientLight intensity={1.45} color="#f8f5ee" />
      <hemisphereLight intensity={0.9} color="#fff6df" groundColor="#8db299" />
      <directionalLight position={[3, 4, 3]} intensity={2.38} color="#fffaf1" />
      <directionalLight position={[-2, 1.4, -3]} intensity={1.1} color="#b7d7c8" />
      <directionalLight position={[0, 2.6, 4]} intensity={1.05} color="#ffffff" />
      <spotLight
        position={[0, 3.4, 1.8]}
        angle={0.38}
        intensity={17}
        penumbra={0.6}
        color="#fdf4dc"
      />

      <group scale={model.sceneScale} position={model.scenePosition}>
        <Center>
          <ModelAsset assetPath={model.assetPath} />
        </Center>
      </group>

      <OrbitControls
        makeDefault
        enablePan={false}
        target={model.controlsTarget}
        minDistance={1.15}
        maxDistance={8.8}
        maxPolarAngle={Math.PI * 0.52}
        minPolarAngle={Math.PI * 0.18}
        autoRotate
        autoRotateSpeed={0.42}
      />
    </>
  )
}

export function Phase2Scene({ onContinue }: Phase2SceneProps) {
  const [metadata, setMetadata] = useState<TagsPayload['metadata'] | null>(null)
  const [tags, setTags] = useState<TagItem[]>([])
  const [activeTagId, setActiveTagId] = useState<string | null>(null)
  const [selectedModelId, setSelectedModelId] = useState<ScenicModelId>('suzhou-pavilion')

  useEffect(() => {
    let mounted = true

    const loadTags = async () => {
      const response = await fetch('/assets/tags.json')
      const data = (await response.json()) as TagsPayload

      if (!mounted) {
        return
      }

      setMetadata(data.metadata)
      setTags(data.tags)
      setActiveTagId(null)
    }

    void loadTags()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    setActiveTagId(null)
  }, [selectedModelId])

  const selectedModel = MODEL_OPTIONS.find((model) => model.id === selectedModelId) ?? MODEL_OPTIONS[0]
  const activeTag = tags.find((tag) => tag.id === activeTagId) ?? null

  const handleSelectTag = (tag: TagItem | null) => {
    setActiveTagId(tag?.id ?? null)
  }

  const detailTitle = activeTag?.name ?? selectedModel.name
  const detailDescription =
    selectedModel.supportsHotspots && activeTag ? activeTag.description : selectedModel.description
  const modelSummary = selectedModel.id === 'suzhou-pavilion' ? metadata?.description ?? selectedModel.description : selectedModel.description

  return (
    <section className="relative h-screen overflow-hidden bg-[#d7e7d7] text-yuan-shan-dai">
      <div
        className="absolute inset-0 scale-[1.02] bg-cover bg-center bg-no-repeat opacity-[0.94]"
        style={{
          backgroundImage: `url('${PHASE2_BG_IMAGE}')`,
          filter: 'saturate(1.34) contrast(1.06) brightness(0.98)',
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(234,243,232,0.08),rgba(227,236,228,0.04)_38%,rgba(219,229,222,0.10))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(54,115,76,0.34),transparent_24%),radial-gradient(circle_at_78%_18%,rgba(44,96,64,0.28),transparent_22%),radial-gradient(circle_at_50%_55%,rgba(255,255,255,0.03),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.00)_26%,rgba(36,55,42,0.10))]" />

      <div className="relative mx-auto flex h-full w-full max-w-[1680px] flex-col px-4 pb-4 pt-20 lg:px-6 lg:pb-6 lg:pt-24">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-[26px] border border-white/68 bg-[rgba(236,246,238,0.58)] px-4 py-3 shadow-mist-panel backdrop-blur-xl md:hidden">
          <div className="text-right">
            <p className="text-[11px] tracking-[0.28em] text-tian-shui-bi">掌中微缩</p>
            <p className="mt-1 text-sm text-mo-qing">{selectedModel.name}</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-[#cfd9d4] bg-white/86 px-4 py-2 text-xs tracking-[0.18em] text-yuan-shan-dai"
            onClick={() => setActiveTagId(null)}
          >
            收起小卡
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[minmax(240px,20%)_minmax(680px,1fr)_minmax(240px,20%)]">
          <aside className="hidden min-h-0 flex-col overflow-hidden rounded-[30px] border border-white/68 bg-[linear-gradient(180deg,rgba(225,241,229,0.34),rgba(214,232,220,0.30))] p-6 shadow-mist-panel backdrop-blur-xl md:flex">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.62]"
              style={{
                backgroundImage: `url('${PHASE2_BG_IMAGE}')`,
                backgroundPosition: 'left center',
                backgroundSize: 'cover',
                filter: 'saturate(1.28) contrast(1.05) brightness(0.98)',
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(242,248,243,0.18),rgba(232,242,236,0.10)_38%,rgba(220,234,224,0.16))]" />
            <div className="relative z-10 shrink-0">
              <span className="inline-flex rounded-full border border-tian-shui-bi/25 bg-tian-shui-bi/10 px-4 py-1 text-[11px] tracking-[0.35em] text-tian-shui-bi">
                Phase 2
              </span>
              <h2 className="mt-5 text-3xl font-semibold tracking-[0.16em] text-mo-qing drop-shadow-[0_1px_1px_rgba(255,255,255,0.22)]">
                掌中微缩
              </h2>
              <p className="mt-4 text-sm font-semibold leading-8 text-[rgba(31,37,45,0.98)] drop-shadow-[0_1px_0_rgba(255,255,255,0.28)]">
                左侧可切换三组园林微缩模型，中栏保持绝对视觉中心。四角亭支持部位点击讲解，新加入的塔影亭与湖心亭以整体导览为主。
              </p>
            </div>

            <div className="relative z-10 mt-6 shrink-0 rounded-[26px] border border-[#c8d8d0]/70 bg-[rgba(238,246,240,0.38)] p-4 backdrop-blur-md">
              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-black tracking-[0.28em] text-black">微缩模型</p>
                  <span className="attention-float rounded-full border border-white/42 bg-[rgba(18,26,32,0.42)] px-4 py-1.5 text-[12px] font-black tracking-[0.1em] text-white shadow-[0_10px_18px_rgba(0,0,0,0.12)] backdrop-blur-md">
                    点击切换其他模型
                  </span>
                </div>
                <div className="mt-4 grid gap-3">
                  {MODEL_OPTIONS.map((model) => {
                    const isActive = model.id === selectedModel.id

                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => setSelectedModelId(model.id)}
                        className={`w-full rounded-[22px] border px-4 py-3 text-left transition ${
                          isActive
                            ? 'border-tian-shui-bi/44 bg-[rgba(126,177,144,0.30)] shadow-[0_12px_24px_rgba(81,88,106,0.08)]'
                            : 'border-[#d6ddd9] bg-[rgba(242,248,243,0.46)] hover:border-tian-shui-bi/28 hover:bg-[rgba(242,248,243,0.58)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[15px] font-semibold tracking-[0.04em] text-mo-qing">{model.name}</p>
                          <span className="rounded-full border border-black/25 bg-white/88 px-2.5 py-1 text-[10px] font-black tracking-[0.16em] text-black shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
                            {model.badge}
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] tracking-[0.18em] text-[rgba(97,122,113,0.98)]">{model.location}</p>
                        <p className="mt-2 text-[13px] leading-5 text-[rgba(72,82,88,0.92)]">{model.shortIntro}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-5 shrink-0 text-xs leading-7 text-[rgba(66,75,80,0.92)] drop-shadow-[0_1px_0_rgba(255,255,255,0.22)]">
              <p>
                操作方式：拖拽旋转，滚轮缩放；四角亭可点构件讲解，塔影亭与湖心亭为
                <span className="font-black text-black">整体导览</span>。
              </p>
            </div>
          </aside>

          <section className="relative order-1 min-h-0 overflow-hidden rounded-[38px] border border-white/70 bg-[linear-gradient(180deg,rgba(241,246,240,0.16),rgba(226,234,229,0.10))] shadow-[0_36px_80px_rgba(31,37,45,0.14)] backdrop-blur-[1px] md:order-none">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.82]"
              style={{
                backgroundImage: `url('${PHASE2_BG_IMAGE}')`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                filter: 'saturate(1.3) contrast(1.06) brightness(0.99)',
              }}
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(55,124,77,0.36),transparent_65%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.00)_18%,rgba(42,61,49,0.08))]" />

            <div className="relative z-10 flex h-full min-h-[62vh] flex-col md:min-h-0">
              <header className="flex items-start justify-between px-5 pb-2 pt-5 md:px-8 md:pt-6">
                <div>
                  <p className="text-xs tracking-[0.32em] text-tian-shui-bi">绝对视觉中心</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-semibold tracking-[0.14em] text-mo-qing md:text-3xl">
                      {selectedModel.name}
                    </h3>
                    {selectedModel.supportsHotspots ? (
                      <span className="rounded-full border border-white/35 bg-[rgba(18,26,32,0.34)] px-3.5 py-1.5 text-[12px] font-black tracking-[0.1em] text-white shadow-[0_8px_18px_rgba(0,0,0,0.12)] backdrop-blur-md">
                        可点击模型查看细节
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="attention-float -translate-x-4 rounded-full border border-white/48 bg-[rgba(12,20,26,0.56)] px-7 py-3.5 text-[18px] font-black tracking-[0.12em] text-white shadow-[0_16px_30px_rgba(0,0,0,0.22)] backdrop-blur-md md:px-9 md:text-[20px] md:tracking-[0.16em]">
                  转动滚轮可放大
                </div>
              </header>

              <div className="flex-1 px-3 pb-3 md:min-h-0 md:px-4 md:pb-4 lg:px-5 lg:pb-5">
                <div className="relative h-full min-h-[360px] overflow-hidden rounded-[32px] border border-white/68 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.42),rgba(232,238,234,0.18)_54%,rgba(214,223,219,0.20))]">
                  <div
                    className="pointer-events-none absolute inset-0 z-0 opacity-[0.62]"
                    style={{
                      backgroundImage: `url('${PHASE2_BG_IMAGE}')`,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                      filter: 'saturate(1.28) contrast(1.04) brightness(0.99)',
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.28),rgba(255,255,255,0.06)_32%,transparent_60%),radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.10),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.00)_28%,rgba(78,144,103,0.14))]" />
                  <Canvas
                    key={selectedModel.id}
                    camera={{ position: selectedModel.cameraPosition, fov: 32 }}
                    className="relative z-10"
                    onPointerMissed={() => setActiveTagId(null)}
                  >
                    <Suspense fallback={<CanvasLoadingOverlay />}>
                      {selectedModel.supportsHotspots ? (
                        <PavilionScene
                          model={selectedModel}
                          tags={tags}
                          activeTagId={activeTagId}
                          onSelectTag={handleSelectTag}
                        />
                      ) : (
                        <ScenicModelScene model={selectedModel} />
                      )}
                    </Suspense>
                  </Canvas>
                </div>
              </div>
            </div>
          </section>

          <aside className="hidden min-h-0 flex-col overflow-hidden rounded-[30px] border border-white/68 bg-[linear-gradient(180deg,rgba(225,241,229,0.34),rgba(214,232,220,0.30))] p-5 shadow-mist-panel backdrop-blur-xl md:flex">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.62]"
              style={{
                backgroundImage: `url('${PHASE2_BG_IMAGE}')`,
                backgroundPosition: 'right center',
                backgroundSize: 'cover',
                filter: 'saturate(1.28) contrast(1.05) brightness(0.98)',
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(242,248,243,0.18),rgba(232,242,236,0.10)_38%,rgba(220,234,224,0.16))]" />
            <div className="relative z-10 shrink-0">
              <button
                type="button"
                onClick={onContinue}
                className="attention-float w-full rounded-[26px] border border-white/48 bg-[rgba(12,20,26,0.54)] px-6 py-4 text-left text-white shadow-[0_18px_32px_rgba(0,0,0,0.18)] backdrop-blur-md transition hover:bg-[rgba(12,20,26,0.64)]"
              >
                <p className="text-[24px] font-black tracking-[0.1em] text-white">进入下一幕，解锁更多体验</p>
              </button>
              <h3 className="mt-3 text-[30px] font-semibold tracking-[0.08em] text-mo-qing">
                {detailTitle}
              </h3>
            </div>

            <div className="relative z-10 mt-5 rounded-[26px] border border-tian-shui-bi/22 bg-[linear-gradient(180deg,rgba(241,247,242,0.48),rgba(234,243,237,0.40))] p-5 shadow-[0_18px_40px_rgba(31,37,45,0.08)] backdrop-blur-md">
              <p className="text-sm font-black tracking-[0.24em] text-black">详细解析</p>
              <div className="mt-4 max-h-[270px] overflow-y-auto rounded-[22px] border border-[#d6ddd9]/80 bg-[rgba(246,250,246,0.56)] px-4 py-4 text-[15px] leading-8 text-yuan-shan-dai/90">
                {detailDescription}
              </div>
            </div>

            <div className="relative z-10 mt-5 shrink-0 rounded-[26px] border border-[#d3ddd8]/85 bg-[rgba(241,247,242,0.62)] p-4 text-sm leading-7 text-yuan-shan-dai/86 backdrop-blur-md">
              <p className="text-xs font-black tracking-[0.24em] text-black">模型说明</p>
              <p className="mt-3">{modelSummary}</p>
            </div>

            <div className="relative z-10 mt-5 shrink-0 rounded-[26px] bg-[rgba(120,154,128,0.22)] p-4 text-xs leading-7 text-yuan-shan-dai/82 backdrop-blur-md">
              <p>当前模型：{selectedModel.style}</p>
              <p>
                讲解模式：
                <span className={selectedModel.supportsHotspots ? '' : 'font-black text-black'}>
                  {selectedModel.supportsHotspots ? `部位点读 ${tags.length} 处` : '整体导览'}
                </span>
              </p>
              <button
                type="button"
                onClick={onContinue}
                className="mt-4 rounded-full border border-tian-shui-bi/30 bg-tian-shui-bi/12 px-4 py-2 tracking-[0.16em] text-tian-shui-bi transition hover:bg-tian-shui-bi/18"
              >
                进入下一幕
              </button>
            </div>
          </aside>
        </div>

        <div
          className={`fixed inset-x-4 bottom-4 z-40 rounded-[30px] border border-white/74 bg-[rgba(235,246,237,0.82)] shadow-[0_28px_70px_rgba(31,37,45,0.18)] backdrop-blur-xl transition-all duration-500 md:hidden ${
            activeTag ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-[115%] opacity-0'
          }`}
        >
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tracking-[0.26em] text-tian-shui-bi">移动端科普</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[0.12em] text-mo-qing">
                  {detailTitle}
                </h3>
              </div>
              <button
                type="button"
                className="rounded-full border border-[#c9d7d1] bg-white/82 px-4 py-2 text-xs tracking-[0.18em] text-yuan-shan-dai"
                onClick={() => setActiveTagId(null)}
              >
                收起
              </button>
            </div>

            <div className="mt-4 rounded-[24px] border border-[#d3ddd8]/85 bg-[linear-gradient(180deg,rgba(242,248,243,0.78),rgba(235,244,238,0.66))] p-4">
              <p className="text-xs tracking-[0.24em] text-tian-shui-bi">当前导览</p>
              <p className="mt-3 text-sm leading-7 text-yuan-shan-dai/84">
                {detailDescription}
              </p>
            </div>

            <button
              type="button"
              onClick={onContinue}
              className="mt-4 w-full rounded-full border border-tian-shui-bi/30 bg-tian-shui-bi/12 px-4 py-3 text-sm tracking-[0.16em] text-tian-shui-bi"
            >
              进入下一幕
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

useGLTF.preload('/assets/suzhou-pavilion.glb')
