import * as THREE from 'three'
import {Container, Text} from 'pixi.js'
import gsap from 'gsap'

import {Game} from '../Core/Game'
import {Config} from '../Core/Config'
import {Plot, TPlotID} from '../Entities/Plot'


type SlotEffect = {
  object3D: THREE.Object3D | null
  text: Text
  active: boolean
  yOffset: number
  worldOffset: THREE.Vector3
}


export class SpendMoney {
  private game: Game
  private plots!: Plot[]
  public container: Container

  private slots!: Record<TPlotID, SlotEffect> = {}
  private tmpWorldPos = new THREE.Vector3()
  private tmpProjected = new THREE.Vector3()

  constructor() {
    this.game = Game.getInstance()

    this.container = new Container()
    this.container.eventMode = 'none'
    this.container.interactiveChildren = false

    this.game.plotManager.addEventListener('plotsInited', () => {
      this.plots = this.game.plotManager.plots
      for (const plot of this.plots) {
        const t = new Text({
          text: '',
          style: {
            fill: 0xff3b30,
            fontSize: 40,
            fontWeight: '900',
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowAlpha: 0.35,
            dropShadowBlur: 2,
            dropShadowDistance: 1,
          },
        })

        t.anchor.set(0.5)
        t.visible = false

        this.container.addChild(t)

        this.slots[plot.id] = {
          object3D: null,
          text: t,
          active: false,
          yOffset: 0,
          worldOffset: new THREE.Vector3(0, 0.6, 0),
        }

        this.bindSlot(plot.id, plot.object, 1)
      }
    })
  }

  bindSlot(id: TPlotID, object3D: THREE.Object3D, worldOffsetY: number = 0.6) {
    const s = this.slots[id]
    s.object3D = object3D
    s.worldOffset.set(0, worldOffsetY, 0)
  }

  play(id: TPlotID, cost: number) {
    const s = this.slots[id]
    if (!s.object3D) return

    s.text.text = `-${cost}`
    s.text.alpha = 1
    s.text.scale.set(1)
    s.yOffset = 0
    s.active = true
    s.text.visible = true

    gsap.killTweensOf(s)
    gsap.killTweensOf(s.text)

    gsap.to(s, {
      yOffset: -150,
      duration: 2.5,
      ease: 'power1.out',
    })

    gsap.to(s.text, {
      alpha: 0,
      duration: 3,
      ease: 'power1.out',
      onComplete: () => {
        s.active = false
        s.text.visible = false
      },
    })
  }

  update = () => {
    const camera = this.game.world.camera
    const renderer = this.game.ui.application.renderer
    const w = renderer.width
    const h = renderer.height

    for (const key in this.slots) {
      // @ts-ignore
      const s = this.slots[key]
      if (!s.active || !s.object3D) continue

      s.object3D.getWorldPosition(this.tmpWorldPos)
      this.tmpWorldPos.add(s.worldOffset)

      this.tmpProjected.copy(this.tmpWorldPos).project(camera)

      if (this.tmpProjected.z < -1 || this.tmpProjected.z > 1) {
        s.text.visible = false
        continue
      }

      s.text.visible = true

      const x = (this.tmpProjected.x + 1) * 0.5 * w
      const y = (-this.tmpProjected.y + 1) * 0.5 * h

      s.text.x = x
      s.text.y = y + s.yOffset
    }
  }
}
