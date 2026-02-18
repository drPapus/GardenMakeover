import {Container, Sprite, Texture, Graphics} from 'pixi.js'
import {gsap} from 'gsap'

import {Game} from '../Core/Game'
import {Config} from '../Core/Config'


type TMode = 'day' | 'night'


export class DayNightToggle {
  private game: Game
  private timeline!: gsap.core.Timeline

  container: Container
  private background!: Graphics
  private icon!: Sprite

  private dayTexture!: Texture
  private nightTexture!: Texture

  mode: TMode = 'day'

  private size = 40
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

      this.background = new Graphics()
      this.drawBackground()
      this.container.addChild(this.background)

      this.icon = new Sprite(this.dayTexture)
      this.icon.anchor.set(0.5)
      this.container.addChild(this.icon)

      this.setupInteraction()
      this.timeline = this.createTimeline()

      this.applyVisualMode()
      this.resize()
    })

  }

  private drawBackground() {
    const r = this.size / 2

    this.background.clear()

    this.background
      .circle(0, 0, r + 2)
      .fill({color: '#000000', alpha: 0.10})

    this.background
      .circle(0, 0, r)
      .fill({color: '#7c431b', alpha: 0.95})

    this.background
      .circle(0, 0, r)
      .stroke({width: 2, color: '000000', alpha: 0.12})
  }


  resize() {
    if (!this.icon) return

    const {clientWidth, clientHeight} = this.game.canvasContainer

    const x = clientWidth - this.padding - this.size / 2
    const y = clientHeight - this.padding - this.size / 2

    this.container.position.set(x, y)

    const iconScale = (this.size * 0.55) / Math.max(
      this.icon.texture.width,
      this.icon.texture.height,
    )
    this.icon.scale.set(iconScale)
  }

  private setupInteraction() {
    this.container.on('pointertap', () => this.toggle())

    this.container.on('pointerdown', () => {
      gsap.to(this.container.scale, {x: 0.9, y: 0.9, duration: 0.1})
    })

    this.container.on('pointerup', () => {
      gsap.to(this.container.scale, {x: 1, y: 1, duration: 0.15})
    })

    this.container.on('pointerover', () => {
      gsap.to(this.container, {alpha: 1, duration: 0.15})
    })

    this.container.on('pointerout', () => {
      gsap.to(this.container, {alpha: 0.95, duration: 0.15})
    })
  }

  private toggle() {
    if (this.mode === 'day') {
      this.mode = 'night'
      this.timeline.play()
    } else {
      this.mode = 'day'
      this.timeline.reverse()
    }

    this.applyVisualMode()
  }

  private applyVisualMode() {
    this.icon.texture =
      this.mode === 'day' ? this.dayTexture : this.nightTexture
  }

  private createTimeline() {
    const {day, night} = Config.lights

    const tl = gsap.timeline({paused: true})

    tl.fromTo(
      this.game.world.directionalLight,
      {intensity: day.directional.intensity},
      {intensity: night.directional.intensity, duration: 0.6},
    )

    tl.fromTo(
      this.game.world.directionalLight.position,
      day.directional.position,
      {...night.directional.position, duration: 0.6},
      0,
    )

    return tl
  }
}
