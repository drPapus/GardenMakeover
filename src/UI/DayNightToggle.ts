import {Container, Sprite, Texture, Graphics} from 'pixi.js'
import {gsap} from 'gsap'

import {Game} from '../Core/Game'
import {Config} from '../Core/Config'


type TMode = 'day' | 'night'


export class DayNightToggle {
  private game: Game
  private lightTransitionTimeline!: gsap.core.Timeline

  container: Container
  private backgroundGraphics!: Graphics
  private modeIcon!: Sprite

  private dayTexture!: Texture
  private nightTexture!: Texture

  currentMode: TMode = 'day'

  private buttonSize = 40
  private padding = 20

  constructor() {
    this.game = Game.getInstance()

    this.container = new Container()
    this.container.eventMode = 'static'
    this.container.cursor = 'pointer'

    this.game.assets.addEventListener('assetsLoaded', () => {
      const dayTexture = this.game.assets.textures['lightMode']
      const nightTexture = this.game.assets.textures['darkMode']

      this.dayTexture = dayTexture
      this.nightTexture = nightTexture

      this.backgroundGraphics = new Graphics()
      this.drawBackground()
      this.container.addChild(this.backgroundGraphics)

      this.modeIcon = new Sprite(this.dayTexture)
      this.modeIcon.anchor.set(0.5)
      this.container.addChild(this.modeIcon)

      this.setupInteraction()
      this.lightTransitionTimeline = this.createTimeline()

      this.applyVisualMode()
      this.resize()
    })

  }

  private drawBackground() {
    const radius = this.buttonSize / 2

    this.backgroundGraphics.clear()

    this.backgroundGraphics
      .circle(0, 0, radius + 2)
      .fill({color: '#000000', alpha: 0.10})

    this.backgroundGraphics
      .circle(0, 0, radius)
      .fill({color: '#7c431b', alpha: 0.95})

    this.backgroundGraphics
      .circle(0, 0, radius)
      .stroke({width: 2, color: '#000000', alpha: 0.12})
  }


  resize() {
    if (!this.modeIcon) return

    const {clientWidth, clientHeight} = this.game.canvasContainer

    const x = clientWidth - this.padding - this.buttonSize / 2
    const y = clientHeight - this.padding - this.buttonSize / 2

    this.container.position.set(x, y)

    const iconScale = (this.buttonSize * 0.55) / Math.max(
      this.modeIcon.texture.width,
      this.modeIcon.texture.height,
    )
    this.modeIcon.scale.set(iconScale)
  }

  private setupInteraction() {
    this.container.on('pointertap', () => this.toggle())

    this.container.on('pointerdown', () => {
      gsap.killTweensOf(this.container.scale)
      gsap.to(this.container.scale, {x: 0.9, y: 0.9, duration: 0.1})
    })

    this.container.on('pointerup', () => {
      gsap.killTweensOf(this.container.scale)
      gsap.to(this.container.scale, {x: 1, y: 1, duration: 0.15})
    })

    this.container.on('pointerupoutside', () => {
      gsap.killTweensOf(this.container.scale)
      gsap.to(this.container.scale, {x: 1, y: 1, duration: 0.15})
    })

    this.container.on('pointerover', () => {
      gsap.killTweensOf(this.container)
      gsap.to(this.container, {alpha: 1, duration: 0.15})
    })

    this.container.on('pointerout', () => {
      gsap.killTweensOf(this.container.scale)
      gsap.to(this.container, {alpha: 0.95, duration: 0.15})
    })
  }

  private toggle() {
    if (this.currentMode === 'day') {
      this.currentMode = 'night'
      this.lightTransitionTimeline.play()
    } else {
      this.currentMode = 'day'
      this.lightTransitionTimeline.reverse()
    }

    this.applyVisualMode()
  }

  private applyVisualMode() {
    this.modeIcon.texture = this.currentMode === 'day' ? this.dayTexture : this.nightTexture
  }

  private createTimeline() {
    const {day, night} = Config.lights

    const tl = gsap.timeline({paused: true})

    tl.fromTo(
      this.game.world.directionalLight,
      {
        intensity: day.directional.intensity,
      },
      {
        intensity: night.directional.intensity,
        duration: 0.6,
      },
    )

    tl.fromTo(
      this.game.world.directionalLight.position,
      day.directional.position,
      {
        ...night.directional.position,
        duration: 0.6,
      },
      0,
    )

    return tl
  }
}
