import {Vector3} from 'three'
import {Container, Graphics} from 'pixi.js'

import {Game} from '../Core/Game'
import {Plot, TPlotID} from '../Entities/Plot'

type TSlot = {
  plot: Plot
  root: Container
  backgroundGraphics: Graphics
  fill: Graphics
  active: boolean
  lastProgress: number
}


export class PlotGrowthProgress {
  private game: Game
  container: Container

  private slots!: Record<TPlotID, TSlot>
  private tmpWorldPosition: Vector3 = new Vector3()
  private tmpProjectedPosition: Vector3 = new Vector3()

  private barWidth: number = 64
  private barHeight: number = 10
  private barRadius: number = 6
  private barWorldOffset: Vector3 = new Vector3(3.5, 0, 0)

  constructor() {
    this.game = Game.getInstance()

    this.container = new Container()
    this.container.eventMode = 'none'
    this.container.interactiveChildren = false

    this.slots = {} as PlotGrowthProgress['slots']

    this.game.plotManager.addEventListener('plotsInited', () => {
      for (const plot of this.game.plotManager.plots) {
        const root = new Container()
        root.visible = false
        root.eventMode = 'none'
        root.interactiveChildren = false

        const backgroundGraphics = new Graphics()
        const fill = new Graphics()

        root.addChild(backgroundGraphics)
        root.addChild(fill)

        this.container.addChild(root)

        this.slots[plot.id] = {
          plot,
          root,
          backgroundGraphics,
          fill,
          active: false,
          lastProgress: -1,
        }

        this.drawBar(backgroundGraphics, fill, -1)
      }
    })
  }

  update() {
    const camera = this.game.world.camera
    const {width, height} = this.game.ui.application.renderer

    for (const plotId in this.slots) {
      const slot = this.slots[plotId as unknown as TPlotID]

      let progress = slot.plot.growthProgress

      if (!Number.isFinite(progress)) progress = 0

      progress = Math.max(0, Math.min(1, progress))

      const shouldShow = progress > 0 && progress < 1

      if (!shouldShow) {
        slot.active = false
        slot.root.visible = false
        continue
      }

      slot.active = true
      slot.root.visible = true

      slot.plot.getWorldPositionWithOffset(this.tmpWorldPosition, this.barWorldOffset)
      this.tmpProjectedPosition.copy(this.tmpWorldPosition).project(camera)

      if (this.tmpProjectedPosition.z < -1 || this.tmpProjectedPosition.z > 1) {
        slot.root.visible = false
        continue
      }

      const x = (this.tmpProjectedPosition.x + 1) * 0.5 * width
      const y = (-this.tmpProjectedPosition.y + 1) * 0.5 * height

      slot.root.x = Math.round(x - this.barWidth / 2)
      slot.root.y = Math.round(y)

      if (Math.abs(progress - slot.lastProgress) > 0.002) {
        slot.lastProgress = progress
        this.drawBar(slot.backgroundGraphics, slot.fill, progress)
      }
    }
  }

  private drawBar(backgroundGraphics: Graphics, fill: Graphics, progress: number) {
    const width = this.barWidth
    const height = this.barHeight
    const radius = this.barRadius

    backgroundGraphics.clear()
    backgroundGraphics.roundRect(0, 0, width, height, radius)
    backgroundGraphics.fill({color: '#000000', alpha: .3})

    const fillWidth = Math.max(0, Math.min(width, width * progress))

    fill.clear()
    fill.roundRect(0, 0, fillWidth, height, radius)
    fill.fill({color: '#7CFC00', alpha: .9})
  }
}
