import * as THREE from 'three'
import {Container, Graphics, Rectangle} from 'pixi.js'
import {Game} from '../Core/Game'
import {Plot, TPlotID} from '../Entities/Plot'


type ProgressProvider = () => number

type SlotBar = {
  object3D: THREE.Object3D | null
  getProgress: ProgressProvider | null
  root: Container
  bg: Graphics
  fill: Graphics
  active: boolean
  lastProgress: number
  worldOffset: THREE.Vector3
}


export class PlotGrowthProgress {
  private game: Game
  public container: Container
  private plots!: Plot[]

  private slots!: Record<TPlotID, SlotBar> = {}
  private tmpWorldPos = new THREE.Vector3()
  private tmpProjected = new THREE.Vector3()

  private barWidth = 64
  private barHeight = 10
  private barRadius = 6

  constructor() {
    this.game = Game.getInstance()

    this.container = new Container()
    this.container.eventMode = 'none'
    this.container.interactiveChildren = false

    this.game.plotManager.addEventListener('plotsInited', () => {
      this.plots = this.game.plotManager.plots
      for (const plot of this.plots) {
        const root = new Container()
        root.visible = false
        root.eventMode = 'none'
        root.interactiveChildren = false

        const bg = new Graphics()
        const fill = new Graphics()

        root.addChild(bg)
        root.addChild(fill)

        this.container.addChild(root)

        this.slots[plot.id] = {
          object3D: null,
          getProgress: null,
          root,
          bg,
          fill,
          active: false,
          lastProgress: -1,
          worldOffset: new THREE.Vector3(0, 0.85, 0),
        }

        this.drawBar(bg, fill, 0)
        this.bindSlot(plot.id, plot.object, () => plot.growthProgress)
      }
    })
  }

  setSize(width: number, height: number, radius: number = 6) {
    this.barWidth = width
    this.barHeight = height
    this.barRadius = radius

    for (const key in this.slots) {
      // @ts-ignore
      const s = this.slots[key]
      this.drawBar(s.bg, s.fill, Math.max(0, s.lastProgress))
    }
  }

  bindSlot(
    id: TPlotID,
    object3D: THREE.Object3D,
    getProgress: ProgressProvider,
    worldOffsetY: number = 0.85,
  ) {
    const s = this.slots[id]
    s.object3D = object3D
    s.getProgress = getProgress
    s.worldOffset.set(0, worldOffsetY, 0)
  }

  update = () => {
    const camera = this.game.world.camera
    const renderer = this.game.ui.application.renderer
    const w = renderer.width
    const h = renderer.height

    for (const key in this.slots) {
      // @ts-ignore
      const s = this.slots[key]
      if (!s.object3D || !s.getProgress) {
        s.root.visible = false
        continue
      }

      let p = s.getProgress()
      if (!Number.isFinite(p)) p = 0
      p = Math.max(0, Math.min(1, p))

      const shouldShow = p > 0 && p < 1

      if (!shouldShow) {
        s.active = false
        s.root.visible = false
        continue
      }

      s.active = true
      s.root.visible = true

      s.object3D.getWorldPosition(this.tmpWorldPos)
      this.tmpWorldPos.add(s.worldOffset)

      this.tmpProjected.copy(this.tmpWorldPos).project(camera)

      if (this.tmpProjected.z < -1 || this.tmpProjected.z > 1) {
        s.root.visible = false
        continue
      }

      const x = (this.tmpProjected.x + 1) * 0.5 * w
      const y = (-this.tmpProjected.y + 1) * 0.5 * h

      s.root.x = x - this.barWidth / 2
      s.root.y = y

      if (Math.abs(p - s.lastProgress) > 0.002) {
        s.lastProgress = p
        this.drawBar(s.bg, s.fill, p)
      }
    }
  }

  private drawBar(bg: Graphics, fill: Graphics, progress: number) {
    const w = this.barWidth
    const h = this.barHeight
    const r = this.barRadius

    bg.clear()
    bg.roundRect(0, 0, w, h, r)
    bg.fill(0x000000)
    bg.alpha = 0.28

    const fillW = Math.max(0, Math.min(w, w * progress))

    fill.clear()
    fill.roundRect(0, 0, fillW, h, r)
    fill.fill(0x7CFC00)
    fill.alpha = 0.9

    bg.hitArea = new Rectangle(0, 0, w, h)
  }
}
