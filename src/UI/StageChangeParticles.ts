import {Vector3} from 'three'
import {Container, Sprite, Texture} from 'pixi.js'
import {gsap} from 'gsap'

import {Game} from '../Core/Game'
import {Plot, TPlotID} from '../Entities/Plot'


type TSlot = {
  plot: Plot
}

type TPuff = {
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
  container: Container

  private texture!: Texture
  private slots!: Record<string, TSlot>

  private tmpWorldPosition: Vector3 = new Vector3()
  private tmpProjectedPosition: Vector3 = new Vector3()
  private worldOffset: Vector3 = new Vector3(0, 0, 0)

  private puffs: TPuff[] = []
  private poolSize = 10

  private cloudCount = 10
  private baseScale = 1
  private maxScale = 1.5

  constructor() {
    this.game = Game.getInstance()
    this.container = new Container()
    this.container.eventMode = 'none'
    this.container.interactiveChildren = false

    this.slots = {} as StageChangeParticles['slots']

    this.game.plotManager.addEventListener('plotsInited', () => {
      this.texture = this.game.assets.textures['smoke']

      this.initPool()

      const plots = this.game.plotManager.plots

      for (const plot of plots) {
        this.slots[plot.id] = {
          plot,
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

  private buildOffsetsForRect(width: number, height: number, count: number) {
    const offsets: { x: number; y: number }[] = []

    const cols = 5
    const rows = 2

    const cellWidth = width / cols
    const cellHeight = height / rows

    let i = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (i >= count) break

        const x = -width / 2 + (c + 0.5) * cellWidth + (Math.random() - 0.5) * cellWidth * 0.35
        const y = -height / 2 + (r + 0.5) * cellHeight + (Math.random() - 0.5) * cellHeight * 0.35

        offsets.push({x, y})
        i++
      }
    }

    return offsets
  }

  play(plotId: TPlotID) {
    const slot = this.slots[plotId]

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
      const cloudSprite = puff.clouds[i]
      const base = this.baseScale + Math.random() * 0.25
      cloudSprite.scale.set(base)
      cloudSprite.rotation = (Math.random() - 0.5) * 0.6
      cloudSprite.x = offsets[i].x
      cloudSprite.y = offsets[i].y
    }

    puff.root.visible = true
    puff.root.alpha = 0
    // puff.root.scale.set(0.75)

    gsap.killTweensOf(puff.root)
    gsap.killTweensOf(puff.root.scale)
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
    const {width, height} = this.game.ui.application.screen

    for (const puff of this.puffs) {
      if (!puff.active || !puff.plotId) continue

      const slot = this.slots[puff.plotId]

      slot.plot.getWorldPositionWithOffset(this.tmpWorldPosition, this.worldOffset)
      this.tmpProjectedPosition.copy(this.tmpWorldPosition).project(camera)

      if (this.tmpProjectedPosition.z < -1 || this.tmpProjectedPosition.z > 1) {
        puff.root.visible = false
        continue
      }

      const x = (this.tmpProjectedPosition.x + 1) * 0.5 * width
      const y = (-this.tmpProjectedPosition.y + 1) * 0.5 * height

      puff.root.visible = true
      puff.root.position.set(x, y)
    }
  }
}
