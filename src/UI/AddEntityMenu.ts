import {Container, Graphics, Sprite, Text, Rectangle} from 'pixi.js'
import gsap from 'gsap'

import {TFarmEntity} from '../Entities/Plot'
import {Assets} from '../Core/Assets'
import {Game} from '../Core/Game'
import {Config} from '../Core/Config'


type EntityOption = {
  type: TFarmEntity
  name: string
  price: number
}

const cardOptions = {
  width: 90,
  height: 100,
  radius: 18,
}

type OptionNodes = {
  root: Container
  background: Graphics
  inner: Graphics
  disabledOverlay: Graphics
  redFrame: Graphics

  preview: Sprite
  title: Text

  badge: Container
  badgeBg: Graphics
  badgeCoin: Sprite
  badgeText: Text

  type: TFarmEntity
  price: number
  affordable: boolean
}


export class AddEntityMenu {
  private game: Game
  private assets: Assets

  public container: Container

  private overlay: Graphics
  private content: Container

  private ring: Graphics
  private optionsContainer: Container
  private centerButtonContainer: Container

  private tl!: gsap.core.Timeline
  private isOpen: boolean = false

  private optionNodes = new Map<TFarmEntity, OptionNodes>()
  private lastCenterX: number = 0
  private lastCenterY: number = 0

  constructor() {
    this.game = Game.getInstance()
    this.assets = this.game.assets

    this.container = new Container()
    this.container.visible = false
    this.container.eventMode = 'none'

    this.overlay = new Graphics()
    this.overlay.eventMode = 'static'
    this.overlay.cursor = 'default'
    this.overlay.alpha = 0
    this.overlay.on('pointerup', () => this.close())

    this.content = new Container()
    this.content.eventMode = 'passive'
    this.content.interactiveChildren = true
    this.content.alpha = 0
    this.content.scale.set(0.92)

    this.ring = new Graphics()

    this.optionsContainer = new Container()
    this.centerButtonContainer = new Container()

    this.content.addChild(this.ring)
    this.content.addChild(this.optionsContainer)
    this.content.addChild(this.centerButtonContainer)

    this.container.addChild(this.overlay)
    this.container.addChild(this.content)

    this.assets.addEventListener('assetsLoaded', () => {
      this.buildOnce()

      this.tl = gsap.timeline({
        paused: true,
        defaults: {ease: 'power2.out'},
        onReverseComplete: () => {
          this.container.visible = false
          this.container.eventMode = 'none'
        },
      })

      this.tl.to(this.overlay, {alpha: 0.22, duration: 0.12}, 0)
      this.tl.to(this.content, {alpha: 1, duration: 0.14}, 0)
      this.tl.to(this.content.scale, {x: 1, y: 1, duration: 0.18}, 0)

      const nodes = [...this.optionNodes.values()]
      nodes.forEach((n, i) => {
        this.tl.to(n.root, {alpha: 1, duration: 0.12}, 0.04 + i * 0.02)
        this.tl.to(n.root.scale, {x: 1, y: 1, duration: 0.16, ease: 'back.out(1.6)'}, 0.04 + i * 0.02)
      })
    })
  }

  resize(width: number, height: number) {
    this.overlay.clear()
    this.overlay.rect(0, 0, width, height)
    this.overlay.fill(0x000000)
    this.overlay.hitArea = new Rectangle(0, 0, width, height)

    this.lastCenterX = width / 2
    this.lastCenterY = height / 2
    this.content.x = this.lastCenterX
    this.content.y = this.lastCenterY
  }

  open() {
    const width = this.game.ui.application.renderer.width
    const height = this.game.ui.application.renderer.height

    this.resize(width, height)

    this.container.visible = true
    this.container.eventMode = 'passive'

    this.updateAffordability()

    this.overlay.alpha = 0
    this.content.alpha = 0
    this.content.scale.set(0.92)

    for (const n of this.optionNodes.values()) {
      n.root.alpha = 0
      n.root.scale.set(0.82)
    }

    this.isOpen = true
    this.tl.play(0)
  }

  close() {
    if (!this.isOpen) return
    this.isOpen = false

    this.container.eventMode = 'none'
    this.tl.reverse()

    this.game.plotManager.setHittedPlot(null)
  }

  private buildOnce() {
    this.buildRing()
    this.buildCenterButton()
    this.buildOptions([...Config.farmEntities])
  }

  private buildRing() {
    this.ring.clear()

    const rOuter = 160
    const rInner = 132

    this.ring.circle(0, 0, rOuter)
    this.ring.stroke({width: 26, color: 0xffffff, alpha: 0.45})

    this.ring.circle(0, 0, rInner)
    this.ring.stroke({width: 10, color: 0xffffff, alpha: 0.22})
  }

  private buildCenterButton() {
    this.centerButtonContainer.removeChildren()

    const size = 72
    const center = size / 2

    const deco = new Container()
    deco.eventMode = 'none'
    deco.cursor = 'default'
    deco.pivot.set(center, center)
    deco.x = 0
    deco.y = 0

    const bg = new Graphics()
    bg.circle(center, center, center)
    bg.fill(0xffffff)
    bg.alpha = 0.75

    const inner = new Graphics()
    inner.circle(center, center, center - 4)
    inner.fill(0xffffff)
    inner.alpha = 0.35

    const plusColor = 0xbdbdbd
    const barW = 28
    const barH = 6
    const r = 3

    const hBar = new Graphics()
    hBar.roundRect(center - barW / 2, center - barH / 2, barW, barH, r)
    hBar.fill(plusColor)
    hBar.alpha = 0.95

    const vBar = new Graphics()
    vBar.roundRect(center - barH / 2, center - barW / 2, barH, barW, r)
    vBar.fill(plusColor)
    vBar.alpha = 0.95

    deco.addChild(bg)
    deco.addChild(inner)
    deco.addChild(hBar)
    deco.addChild(vBar)

    this.centerButtonContainer.addChild(deco)
  }

  private buildOptions(entityOptions: EntityOption[]) {
    this.optionsContainer.removeChildren()
    this.optionNodes.clear()

    const angleStep = (Math.PI * 2) / entityOptions.length
    const startAngle = -Math.PI / 2

    const cardWidth = cardOptions.width
    const cardHeight = cardOptions.height

    const maxHoverScale = 1.06
    const minGapPixels = 0

    const cardBoundingRadiusPixels = (Math.sqrt((cardWidth * cardWidth) + (cardHeight * cardHeight)) / 2) * maxHoverScale
    const minChordPixels = (cardBoundingRadiusPixels * 2) + minGapPixels
    const minRadiusFromChordPixels = minChordPixels / (2 * Math.sin(Math.PI / entityOptions.length))
    const radius = Math.max(150, minRadiusFromChordPixels)

    for (let index = 0; index < entityOptions.length; index += 1) {
      const option = entityOptions[index]
      const angle = startAngle + angleStep * index

      const optionCenterX = Math.cos(angle) * radius
      const optionCenterY = Math.sin(angle) * radius

      const nodes = this.createOption(option)

      nodes.root.x = optionCenterX
      nodes.root.y = optionCenterY

      nodes.root.alpha = 0
      nodes.root.scale.set(0.82)

      this.optionsContainer.addChild(nodes.root)
      this.optionNodes.set(option.type, nodes)
    }
  }

  private getCardColor(type: TFarmEntity) {
    const map: Record<string, number> = {
      grape: 0x9dd6d4,
      strawberry: 0xf3a0a6,
      tomato: 0xd6a6f0,
      chicken: 0xf0d08b,
      cow: 0xa7d7b5,
    }

    const key = String(type)
    return map[key] ?? 0xf7edd6
  }

  private createOption(option: EntityOption): OptionNodes {
    const {width, height, radius} = cardOptions

    const root = new Container()
    root.eventMode = 'static'
    root.cursor = 'pointer'
    root.hitArea = new Rectangle(0, 0, width, height)
    root.pivot.set(width / 2, height / 2)

    const background = new Graphics()
    background.roundRect(0, 0, width, height, radius)
    background.fill(this.getCardColor(option.type))

    const inner = new Graphics()
    inner.roundRect(3, 3, width - 6, height - 8, radius - 2)
    inner.fill(0xffffff)
    inner.alpha = 0.35

    const redFrame = new Graphics()
    redFrame.roundRect(1.5, 1.5, width - 3, height - 3, radius - 2)
    redFrame.stroke({width: 3, color: 0xff3b30, alpha: 0})
    redFrame.alpha = 0

    const texture = this.assets.textures[option.type]
    const preview = new Sprite(texture)
    preview.anchor.set(0.5)
    preview.x = width / 2
    preview.y = 36
    preview.width = 46
    preview.height = 46

    const title = new Text({
      text: option.name,
      style: {fill: 0x3a2a1e, fontSize: 12, fontWeight: '800'},
    })
    title.anchor.set(0.5, 0.5)
    title.x = width / 2
    title.y = 72

    const badge = new Container()

    const badgeBg = new Graphics()
    badgeBg.roundRect(0, 0, 10, 22, 11)
    badgeBg.fill(0xffd34d)
    badgeBg.alpha = 0.95

    const coinTexture = this.assets.textures['money']
    const badgeCoin = new Sprite(coinTexture)
    badgeCoin.anchor.set(0.5)
    badgeCoin.width = 14
    badgeCoin.height = 14

    const badgeText = new Text({
      text: String(option.price),
      style: {fill: 0x3a2a1e, fontSize: 11, fontWeight: '900'},
    })
    badgeText.anchor.set(0, 0.5)

    const padX = 8
    const gap = 4
    const h = 22

    badgeCoin.x = padX + badgeCoin.width / 2
    badgeCoin.y = h / 2

    badgeText.x = badgeCoin.x + badgeCoin.width / 2 + gap
    badgeText.y = h / 2

    const w = padX + badgeCoin.width + gap + badgeText.width + padX
    badgeBg.clear()
    badgeBg.roundRect(0, 0, w, h, 11)
    badgeBg.fill(0xffd34d)

    badge.addChild(badgeBg)
    badge.addChild(badgeCoin)
    badge.addChild(badgeText)

    badge.x = width - w - 6
    badge.y = height - h - 8

    const disabledOverlay = new Graphics()
    disabledOverlay.roundRect(0, 0, width, height, radius)
    disabledOverlay.fill(0x000000)
    disabledOverlay.alpha = 0

    root.addChild(background)
    root.addChild(inner)
    root.addChild(preview)
    root.addChild(title)
    root.addChild(badge)
    root.addChild(disabledOverlay)
    root.addChild(redFrame)

    const nodes: OptionNodes = {
      root,
      background,
      inner,
      disabledOverlay,
      redFrame,
      preview,
      title,
      badge,
      badgeBg,
      badgeCoin,
      badgeText,
      type: option.type,
      price: option.price,
      affordable: true,
    }

    const hoverIn = () => {
      if (!nodes.affordable) return
      gsap.to(root.scale, {x: 1.06, y: 1.06, duration: 0.12, ease: 'power2.out'})
    }

    const hoverOut = () => {
      if (!nodes.affordable) {
        gsap.to(root.scale, {x: 1, y: 1, duration: 0.12, ease: 'power2.out'})
        return
      }
      gsap.to(root.scale, {x: 1, y: 1, duration: 0.12, ease: 'power2.out'})
    }

    const pressIn = () => {
      if (!nodes.affordable) return
      gsap.to(root.scale, {x: 0.96, y: 0.96, duration: 0.08, ease: 'power2.out'})
    }

    const pressOut = () => {
      if (!nodes.affordable) return
      gsap.to(root.scale, {x: 1.06, y: 1.06, duration: 0.08, ease: 'power2.out'})
    }

    const shakeAndWarn = () => {
      const tl = gsap.timeline()
      tl.to(root, {x: root.x - 4, duration: 0.04, ease: 'power2.out'})
      tl.to(root, {x: root.x + 6, duration: 0.06, ease: 'power2.out'})
      tl.to(root, {x: root.x - 4, duration: 0.06, ease: 'power2.out'})
      tl.to(root, {x: root.x + 2, duration: 0.04, ease: 'power2.out'})
      tl.to(root, {x: root.x, duration: 0.04, ease: 'power2.out'})

      gsap.killTweensOf(redFrame)
      redFrame.alpha = 1
      gsap.fromTo(
        redFrame,
        {alpha: 0},
        {alpha: 1, duration: 0.08, ease: 'power2.out', yoyo: true, repeat: 3},
      )
    }

    root.on('pointerover', hoverIn)
    root.on('pointerout', hoverOut)
    root.on('pointerdown', pressIn)
    root.on('pointerup', () => {
      if (!nodes.affordable) {
        this.game.ui.popup.open('Not enough money')
        shakeAndWarn()
        return
      }
      pressOut()
      this.onSelect(nodes.type)
    })
    root.on('pointerupoutside', () => {
      gsap.to(root.scale, {x: 1, y: 1, duration: 0.08, ease: 'power2.out'})
    })

    return nodes
  }

  private updateAffordability() {
    for (const n of this.optionNodes.values()) {
      const affordable = this.game.economy.canAfford(n.price)
      n.affordable = affordable

      if (affordable) {
        n.root.cursor = 'pointer'
        n.root.alpha = 1
        n.disabledOverlay.alpha = 0

        n.badgeBg.clear()
        n.badgeBg.roundRect(0, 0, n.badgeBg.width || 1, 22, 11)
        n.badgeBg.fill(0xffd34d)

        n.badgeText.alpha = 1
        n.badgeCoin.alpha = 1
      } else {
        n.root.cursor = 'not-allowed'
        n.root.alpha = 0.75
        n.disabledOverlay.alpha = 0.22

        const w = n.badgeBg.width || (n.badgeText.width + 40)
        n.badgeBg.clear()
        n.badgeBg.roundRect(0, 0, w, 22, 11)
        n.badgeBg.fill(0x9aa0a6)

        n.badgeText.alpha = 0.85
        n.badgeCoin.alpha = 0.85
      }
    }
  }

  private onSelect(type: TFarmEntity) {
    this.game.plotManager.buyFarmEntity(type)
  }
}
