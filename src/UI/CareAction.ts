import {Vector3} from 'three'
import {Container, Graphics, Sprite} from 'pixi.js'
import gsap from 'gsap'

import {Game} from '../Core/Game'
import {Plot, TPlotID} from '../Entities/Plot'


type TCareAction = 'water' | 'feed'

type TSlot = {
  plot: Plot

  root: Container
  content: Container
  backgroundGraphics: Graphics
  icon: Sprite

  active: boolean
  action: TCareAction | null
}


export class CareAction {
  private game: Game
  container: Container

  private slots!: Record<TPlotID, TSlot>

  private tmpWorldPosition: Vector3 = new Vector3()
  private tmpProjectedPosition: Vector3 = new Vector3()

  private iconWorldOffset: Vector3 = new Vector3(0, 1, 0)

  constructor() {
    this.game = Game.getInstance()

    this.container = new Container()
    this.container.eventMode = 'none'
    this.container.interactiveChildren = false

    this.slots = {} as CareAction['slots']

    this.game.plotManager.addEventListener('plotsInited', () => {
      for (const plot of this.game.plotManager.plots) {
        const root = new Container()
        root.visible = false
        root.eventMode = 'none'
        root.alpha = 1

        const content = new Container()
        root.addChild(content)

        const backgroundGraphics = new Graphics()

        const icon = new Sprite()
        icon.anchor.set(0.5)
        icon.x = 0
        icon.y = 0
        icon.width = 80
        icon.height = 80

        content.addChild(backgroundGraphics)
        content.addChild(icon)

        this.container.addChild(root)

        this.slots[plot.id] = {
          plot,

          root,
          content,
          backgroundGraphics,
          icon,

          active: false,
          action: null,
        }

        plot.addEventListener('needsCare', (e) => {
          this.show(plot.id, e.action)
        })

        plot.addEventListener('careDone', () => this.hide(plot.id))
      }
    })
  }

  private show(id: TPlotID, action: TCareAction) {
    const slot = this.slots[id]

    slot.active = true
    slot.action = action

    slot.icon.texture = this.game.assets.textures[action]

    this.drawButton(slot.backgroundGraphics, action)

    const wasVisible = slot.root.visible

    slot.root.visible = true
    slot.root.alpha = 1

    if (!wasVisible) {
      gsap.fromTo(
        slot.root,
        {alpha: 0},
        {alpha: 1, duration: 0.14, ease: 'power2.out'},
      )

      gsap.killTweensOf(slot.content)
      gsap.to(slot.content, {
        y: -10,
        duration: 0.55,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      })
    }
  }

  hide(id: TPlotID) {
    const slot = this.slots[id]

    gsap.killTweensOf(slot.content)
    gsap.killTweensOf(slot.root)

    slot.active = false
    slot.action = null
    slot.root.visible = false
  }

  update() {
    const camera = this.game.world.camera
    const {width, height} = this.game.ui.application.screen

    for (const plotId in this.slots) {
      const slot = this.slots[plotId as unknown as TPlotID]

      if (!slot.active) continue

      slot.plot.getWorldPositionWithOffset(this.tmpWorldPosition, this.iconWorldOffset)
      this.tmpProjectedPosition.copy(this.tmpWorldPosition).project(camera)

      if (this.tmpProjectedPosition.z < -1 || this.tmpProjectedPosition.z > 1) {
        slot.root.visible = false
        continue
      }

      const x = (this.tmpProjectedPosition.x + 1) * 0.5 * width
      const y = (-this.tmpProjectedPosition.y + 1) * 0.5 * height

      slot.root.x = Math.round(x)
      slot.root.y = Math.round(y)
      slot.root.visible = true
    }
  }

  private drawButton(backgroundGraphics: Graphics, action: TCareAction) {
    const radius = 50
    const color = action === 'water' ? '#2f80ed' : '#27ae60'

    backgroundGraphics.clear()
    backgroundGraphics.circle(0, 0, radius)
    backgroundGraphics.fill(color)

    backgroundGraphics.circle(0, 0, radius - 2)
    backgroundGraphics.stroke({width: 2, color: '#ffffff', alpha: 0.18})
  }
}
