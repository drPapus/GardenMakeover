import * as THREE from 'three'
import {Container, Graphics, Rectangle, Sprite} from 'pixi.js'
import gsap from 'gsap'
import {Game} from '../Core/Game'
import {Plot, TPlotID} from '../Entities/Plot'


type TCareAction = 'water' | 'feed'

type SlotBinding = {
  object3D: THREE.Object3D | null
  plot: any | null

  root: Container
  content: Container
  bg: Graphics
  icon: Sprite

  active: boolean
  action: TCareAction | null

  worldOffset: THREE.Vector3

  unsubscribeNeedsAction: (() => void) | null
  unsubscribeRipe: (() => void) | null
}


export class CareActionUI {
  private game: Game
  public container: Container

  private slots: Record<TPlotID, SlotBinding> = {}

  private tmpWorldPos = new THREE.Vector3()
  private tmpProjected = new THREE.Vector3()

  constructor() {
    this.game = Game.getInstance()


    this.container = new Container()
    this.container.eventMode = 'none'
    this.container.interactiveChildren = true

    this.game.plotManager.addEventListener('plotsInited', () => {
      for (const plot of this.game.plotManager.plots) {
        const root = new Container()
        root.visible = false
        root.eventMode = 'static'
        root.cursor = 'pointer'
        root.alpha = 1

        const content = new Container()
        root.addChild(content)

        const bg = new Graphics()

        const icon = new Sprite()
        icon.anchor.set(0.5)
        icon.x = 0
        icon.y = 0
        icon.width = 40
        icon.height = 40

        content.addChild(bg)
        content.addChild(icon)

        root.hitArea = new Rectangle(-20, -20, 40, 40)

        root.on('pointerover', () => {
          if (!root.visible) return
          gsap.to(root, {alpha: 0.96, duration: 0.08, ease: 'power2.out'})
        })

        root.on('pointerout', () => {
          if (!root.visible) return
          gsap.to(root, {alpha: 1, duration: 0.08, ease: 'power2.out'})
        })

        root.on('pointerdown', () => {
          if (!root.visible) return
          gsap.to(root, {y: root.y + 1, duration: 0.05, ease: 'power2.out'})
        })

        root.on('pointerup', () => {
          if (!root.visible) return
          gsap.to(root, {y: root.y - 1, duration: 0.05, ease: 'power2.out'})
          this.onClick(plot.id)
        })

        root.on('pointerupoutside', () => {
          gsap.to(root, {y: root.y - 1, duration: 0.05, ease: 'power2.out'})
        })

        this.container.addChild(root)

        this.slots[plot.id] = {
          object3D: null,
          plot: null,

          root,
          content,
          bg,
          icon,

          active: false,
          action: null,

          worldOffset: new THREE.Vector3(0, 0.95, 0),

          unsubscribeNeedsAction: null,
          unsubscribeRipe: null,
        }

        this.bindSlot(plot.id, plot.object, plot)
      }
    })
  }

  bindSlot(id: TPlotID, object3D: THREE.Object3D, plot: any, worldOffsetY: number = 0.95) {
    const s = this.slots[id]

    if (s.unsubscribeRipe) s.unsubscribeRipe()

    gsap.killTweensOf(s.root)

    s.object3D = object3D
    s.plot = plot
    s.worldOffset.set(0, worldOffsetY, 0)

    s.unsubscribeNeedsAction = this.subscribe(plot, 'needsCare', (e: any) => {
      const action = (e?.action ?? 'water') as TCareAction
      this.show(id, action)
    })
  }

  private show(id: TPlotID, action: TCareAction) {
    const s = this.slots[id]
    if (!s.object3D) return

    s.active = true
    s.action = action

    s.icon.texture = this.game.assets.textures[action]

    this.drawButton(s.bg, action)

    const wasVisible = s.root.visible

    s.root.visible = true
    s.root.alpha = 1

    if (!wasVisible) {
      gsap.fromTo(
        s.root,
        {alpha: 0},
        {alpha: 1, duration: 0.14, ease: 'power2.out'},
      )

      gsap.killTweensOf(s.content)
      gsap.to(s.content, {
        y: -10,
        duration: 0.55,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      })
    }
  }

  hide(id: TPlotID) {
    const s = this.slots[id]

    gsap.killTweensOf(s.content)

    s.active = false
    s.action = null
    s.root.visible = false
  }

  private onClick(id: TPlotID) {
    const s = this.slots[id]
    if (!s.active || !s.plot) return

    if (typeof s.plot.applyCare === 'function') {
      s.plot.applyCare()
    }

    gsap.killTweensOf(s.root)
    gsap.to(s.root, {
      alpha: 0,
      duration: 0.12,
      ease: 'power2.out',
      onComplete: () => {
        s.root.alpha = 1
        this.hide(id)
      },
    })
  }

  update() {
    const camera = this.game.world.camera
    const renderer = this.game.ui.application.renderer
    const w = renderer.width
    const h = renderer.height

    for (const key in this.slots) {
      const s = this.slots[key]
      if (!s.active || !s.object3D) continue

      s.object3D.getWorldPosition(this.tmpWorldPos)
      this.tmpWorldPos.add(s.worldOffset)

      this.tmpProjected.copy(this.tmpWorldPos).project(camera)

      if (this.tmpProjected.z < -1 || this.tmpProjected.z > 1) {
        console.log('CLIPPED', key, this.tmpProjected.z)
        s.root.visible = false
        continue
      }

      const x = (this.tmpProjected.x + 1) * 0.5 * w
      const y = (-this.tmpProjected.y + 1) * 0.5 * h

      s.root.x = x
      s.root.y = y
      s.root.visible = true
    }
  }

  private drawButton(bg: Graphics, action: TCareAction) {
    const r = 20
    const color = action === 'water' ? 0x2f80ed : 0x27ae60

    bg.clear()
    bg.circle(0, 0, r)
    bg.fill(color)
    bg.alpha = 0.95

    bg.circle(0, 0, r - 2)
    bg.stroke({width: 2, color: 0xffffff, alpha: 0.18})
  }

  private subscribe(plot: any, eventName: string, handler: (e?: any) => void) {
    if (plot && typeof plot.addEventListener === 'function' && typeof plot.removeEventListener === 'function') {
      plot.addEventListener(eventName, handler)
      return () => plot.removeEventListener(eventName, handler)
    }

    if (plot && typeof plot.on === 'function' && typeof plot.off === 'function') {
      plot.on(eventName, handler)
      return () => plot.off(eventName, handler)
    }

    if (plot && typeof plot.addListener === 'function' && typeof plot.removeListener === 'function') {
      plot.addListener(eventName, handler)
      return () => plot.removeListener(eventName, handler)
    }

    return () => {
    }
  }

}
