import {Vector3} from 'three'
import {Container, Text} from 'pixi.js'
import gsap from 'gsap'

import {Game} from '../Core/Game'
import {Plot, TPlotID} from '../Entities/Plot'


type TSlot = {
  plot: Plot
  text: Text
  active: boolean
  yOffset: number
}


export class SpendMoney {
  private game: Game
  container: Container

  private slots!: Record<TPlotID, TSlot>
  private tmpWorldPosition: Vector3 = new Vector3()
  private tmpProjectedPosition: Vector3 = new Vector3()

  private worldOffset: Vector3 = new Vector3(0, 0, 0)

  constructor() {
    this.game = Game.getInstance()

    this.container = new Container()
    this.container.eventMode = 'none'
    this.container.interactiveChildren = false

    this.slots = {} as SpendMoney['slots']

    this.game.plotManager.addEventListener('plotsInited', () => {
      for (const plot of this.game.plotManager.plots) {
        const text = new Text({
          text: '',
          style: {
            fill: '#ff3b30',
            fontSize: 40,
            fontWeight: '900',
            dropShadow: {
              color: '#000000',
              blur: 2,
              distance: 1,
              alpha: .35,
            },
          },
        })

        text.anchor.set(0.5)
        text.visible = false

        this.container.addChild(text)

        this.slots[plot.id] = {
          plot,
          text,
          active: false,
          yOffset: 0,
        }
      }
    })
  }

  play(id: TPlotID, cost: number) {
    const slot = this.slots[id]

    if (!slot) return

    slot.text.text = `-${cost}`
    slot.text.alpha = 1
    slot.text.scale.set(1)
    slot.yOffset = 0
    slot.active = true
    slot.text.visible = true

    gsap.killTweensOf(slot)
    gsap.killTweensOf(slot.text)

    gsap.to(slot, {
      yOffset: -150,
      duration: 2.5,
      ease: 'power1.out',
    })

    gsap.to(slot.text, {
      alpha: 0,
      duration: 3,
      ease: 'power1.out',
      onComplete: () => {
        slot.active = false
        slot.text.visible = false
      },
    })
  }

  update = () => {
    const camera = this.game.world.camera
    const {width, height} = this.game.ui.application.screen

    for (const plotId in this.slots) {
      const slot = this.slots[plotId as unknown as TPlotID]

      if (!slot.active) continue

      slot.plot.getWorldPositionWithOffset(this.tmpWorldPosition, this.worldOffset)
      this.tmpProjectedPosition.copy(this.tmpWorldPosition).project(camera)

      if (this.tmpProjectedPosition.z < -1 || this.tmpProjectedPosition.z > 1) {
        slot.text.visible = false
        continue
      }

      slot.text.visible = true

      const x = (this.tmpProjectedPosition.x + 1) * 0.5 * width
      const y = (-this.tmpProjectedPosition.y + 1) * 0.5 * height

      slot.text.x = Math.round(x)
      slot.text.y = Math.round(y + slot.yOffset)
    }
  }
}
