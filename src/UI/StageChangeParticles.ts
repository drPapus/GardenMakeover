import * as THREE from 'three'
import {Container, Sprite, Texture} from 'pixi.js'
import {gsap} from 'gsap'
import {Game} from '../Core/Game'
import {Plot, TPlotID} from '../Entities/Plot'


type SlotBinding = {
  object3D: THREE.Object3D | null
  worldOffset: THREE.Vector3
}

type Puff = {
  root: Container
  clouds: Sprite[]
  active: boolean
  plotId: TPlotID | null
}


const slotRectPx = {
  width: 250,
  height: 180,
}


export class StageChangeParticles {
  private game: Game
  public container: Container

  private texture!: Texture
  private slots: Record<string, SlotBinding> = {}

  private tmpWorldPos = new THREE.Vector3()
  private tmpProjected = new THREE.Vector3()

  private puffs: Puff[] = []
  private poolSize = 10

  private cloudCount = 10
  private baseScale = 1
  private maxScale = 1.5

  constructor() {
    this.game = Game.getInstance()
    this.container = new Container()
    this.container.eventMode = 'none'
    this.container.interactiveChildren = false

    this.game.plotManager.addEventListener('plotsInited', () => {
      this.texture = this.game.assets.textures['smoke']

      this.initPool()

      const plots = this.game.plotManager.plots

      for (const plot of plots) {
        this.slots[plot.id] = {
          object3D: plot.object,
          worldOffset: new THREE.Vector3(0, 0.65, 0),
        }

        plot.addEventListener('stageChanged' as any, () => {
          this.play(plot.id)
        })
      }
    })
  }

  private initPool() {
    for (let i = 0; i < this.poolSize; i++) {
      const root = new Container()
      root.visible = false
      root.alpha = 0
      root.scale.set(1)
      this.container.addChild(root)

      const clouds: Sprite[] = []

      for (let c = 0; c < this.cloudCount; c++) {
        const s = new Sprite(this.texture)
        s.anchor.set(0.5)
        s.alpha = 1
        root.addChild(s)
        clouds.push(s)
      }

      clouds[0].scale.set(1.2)

      this.puffs.push({
        root,
        clouds,
        active: false,
        plotId: null,
      })
    }
  }

  private buildOffsetsForRect(w: number, h: number, count: number) {
    const offsets: { x: number; y: number }[] = []

    const cols = 5
    const rows = 2

    const cellW = w / cols
    const cellH = h / rows

    let i = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (i >= count) break

        const x = -w / 2 + (c + 0.5) * cellW + (Math.random() - 0.5) * cellW * 0.35
        const y = -h / 2 + (r + 0.5) * cellH + (Math.random() - 0.5) * cellH * 0.35

        offsets.push({x, y})
        i++
      }
    }

    return offsets
  }

  play(plotId: TPlotID) {
    const slot = this.slots[plotId]
    if (!slot?.object3D) return

    const puff = this.puffs.find(p => !p.active)
    if (!puff) return

    puff.active = true
    puff.plotId = plotId

    const offsets = this.buildOffsetsForRect(
      slotRectPx.width,
      slotRectPx.height,
      puff.clouds.length,
    )

    for (let i = 0; i < puff.clouds.length; i++) {
      const s = puff.clouds[i]
      const base = this.baseScale + Math.random() * 0.25
      s.scale.set(base)
      s.rotation = (Math.random() - 0.5) * 0.6
      s.x = offsets[i].x
      s.y = offsets[i].y
    }

    puff.root.visible = true
    puff.root.alpha = 0
    // puff.root.scale.set(0.75)

    gsap.killTweensOf(puff.root)
    gsap.timeline({
      onComplete: () => {
        puff.active = false
        puff.plotId = null
        puff.root.visible = false
        puff.root.alpha = 0
      },
    })
      .to(puff.root, {alpha: 1, duration: 0.08, ease: 'power1.out'}, 0)
      .to(puff.root.scale, {x: 1.15, y: 1.15, duration: 0.10, ease: 'back.out(2.0)'}, 0)
      .to({}, {duration: 0.12})
      .to(puff.root, {alpha: 0, duration: 0.22, ease: 'power1.in'}, '>')
      .to(puff.root.scale, {x: this.maxScale, y: this.maxScale, duration: 0.22, ease: 'power1.out'}, '<')
  }

  update() {
    const camera = this.game.world.camera
    const renderer = this.game.ui.application.renderer
    const w = renderer.width
    const h = renderer.height

    for (const puff of this.puffs) {
      if (!puff.active || !puff.plotId) continue

      const slot = this.slots[puff.plotId]
      if (!slot?.object3D) {
        puff.root.visible = false
        continue
      }

      slot.object3D.getWorldPosition(this.tmpWorldPos)
      this.tmpWorldPos.add(slot.worldOffset)

      this.tmpProjected.copy(this.tmpWorldPos).project(camera)

      if (this.tmpProjected.z < -1 || this.tmpProjected.z > 1) {
        puff.root.visible = false
        continue
      }

      const x = (this.tmpProjected.x + 1) * 0.5 * w
      const y = (-this.tmpProjected.y + 1) * 0.5 * h

      puff.root.visible = true
      puff.root.position.set(x, y)
    }
  }
}
