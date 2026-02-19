import {Container, Graphics, Sprite, Text, Rectangle} from 'pixi.js'
import gsap from 'gsap'

import {TFarmEntity} from '../Entities/Plot'
import {Assets} from '../Core/Assets'
import {Game} from '../Core/Game'
import {Config} from '../Core/Config'


type TEntityOption = {
  type: TFarmEntity
  name: string
  price: number
}

type TOptionNodes = {
  root: Container
  background: Graphics
  inner: Graphics
  disabledOverlay: Graphics
  redFrame: Graphics

  preview: Sprite
  title: Text

  badge: Container
  badgeCoin: Sprite
  badgeText: Text

  type: TFarmEntity
  price: number
  affordable: boolean
}


const cardOptions = {
  width: 90,
  height: 100,
  radius: 18,
}


export class AddEntityMenu {
  private game: Game
  private assets: Assets

  container: Container
  optionsContainer: Container

  private overlay: Graphics
  private content: Container

  private ring: Graphics
  private centerButtonContainer: Container

  private timeline!: gsap.core.Timeline
  private isOpen: boolean = false

  private optionNodes = new Map<TFarmEntity, TOptionNodes>()
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

      this.timeline = gsap.timeline({
        paused: true,
        defaults: {ease: 'power2.out'},
        onReverseComplete: () => {
          this.container.visible = false
          this.container.eventMode = 'none'
        },
      })

      this.timeline.to(this.overlay, {alpha: 0.22, duration: 0.12}, 0)
      this.timeline.to(this.content, {alpha: 1, duration: 0.14}, 0)
      this.timeline.to(this.content.scale, {x: 1, y: 1, duration: 0.18}, 0)

      const nodes = [...this.optionNodes.values()]
      nodes.forEach((node, i) => {
        this.timeline.to(node.root, {alpha: 1, duration: 0.12}, 0.04 + i * 0.02)
        this.timeline.to(node.root.scale, {x: 1, y: 1, duration: 0.16, ease: 'back.out(1.6)'}, 0.04 + i * 0.02)
      })
    })
  }

  resize() {
    const {width, height} = this.game.ui.application.screen

    this.overlay.clear()
    this.overlay.rect(0, 0, width, height)
    this.overlay.fill('#000000')
    this.overlay.hitArea = new Rectangle(0, 0, width, height)

    this.lastCenterX = width / 2
    this.lastCenterY = height / 2
    this.content.x = this.lastCenterX
    this.content.y = this.lastCenterY
  }

  open() {
    this.resize()

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
    this.timeline.play(0)
  }

  close() {
    if (!this.isOpen) return
    this.isOpen = false

    this.container.eventMode = 'none'
    this.timeline.reverse()

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
    this.ring.stroke({width: 26, color: '#ffffff', alpha: 0.45})

    this.ring.circle(0, 0, rInner)
    this.ring.stroke({width: 10, color: '#ffffff', alpha: 0.22})
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
    bg.fill('#ffffff')
    bg.alpha = 0.75

    const inner = new Graphics()
    inner.circle(center, center, center - 4)
    inner.fill('#ffffff')
    inner.alpha = 0.35

    const plusColor = '#bdbdbd'
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

  private buildOptions(entityOptions: TEntityOption[]) {
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
    const map: Record<string, string> = {
      grape: '#d483be',
      strawberry: '#61bf8b',
      tomato: '#e57863',
      chicken: '#bad962',
      cow: '#6bc190',
      sheep: '#d88bc1',
      corn: '#eec664',
    }

    const key = String(type)
    return map[key] ?? '#f7edd6'
  }

  private createOption(option: TEntityOption): TOptionNodes {
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
    inner.fill('#ffffff')
    inner.alpha = 0.35

    const redFrame = new Graphics()
    redFrame.roundRect(1.5, 1.5, width - 3, height - 3, radius - 2)
    redFrame.stroke({width: 3, color: '#ff3b30', alpha: 0})
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
      style: {fill: '#3a2a1e', fontSize: 12, fontWeight: '800'},
    })
    title.anchor.set(0.5, 0.5)
    title.x = width / 2
    title.y = 72

    const badge = new Container()

    const coinTexture = this.assets.textures['money']
    const badgeCoin = new Sprite(coinTexture)
    badgeCoin.anchor.set(0.5)
    badgeCoin.width = 14
    badgeCoin.height = 14

    const badgeText = new Text({
      text: String(option.price),
      style: {fill: '#3a2a1e', fontSize: 11, fontWeight: '900'},
    })
    badgeText.anchor.set(0, 0.5)

    const badgePaddingX = 8
    const badgeGap = 4
    const badgeHeight = 22

    badgeCoin.x = badgePaddingX + badgeCoin.width / 2
    badgeCoin.y = badgeHeight / 2

    badgeText.x = badgeCoin.x + badgeCoin.width / 2 + badgeGap
    badgeText.y = badgeHeight / 2

    const badgeWidth = badgePaddingX + badgeCoin.width + badgeGap + badgeText.width + badgePaddingX

    badge.addChild(badgeCoin)
    badge.addChild(badgeText)

    badge.x = width - badgeWidth - 6
    badge.y = height - badgeHeight - 3

    const disabledOverlay = new Graphics()
    disabledOverlay.roundRect(0, 0, width, height, radius)
    disabledOverlay.fill('#000000')
    disabledOverlay.alpha = 0

    root.addChild(background)
    root.addChild(inner)
    root.addChild(preview)
    root.addChild(title)
    root.addChild(badge)
    root.addChild(disabledOverlay)
    root.addChild(redFrame)

    const nodes: TOptionNodes = {
      root,
      background,
      inner,
      disabledOverlay,
      redFrame,
      preview,
      title,
      badge,
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
      const timeline = gsap.timeline()
      timeline.to(root, {x: root.x - 4, duration: 0.04, ease: 'power2.out'})
      timeline.to(root, {x: root.x + 6, duration: 0.06, ease: 'power2.out'})
      timeline.to(root, {x: root.x - 4, duration: 0.06, ease: 'power2.out'})
      timeline.to(root, {x: root.x + 2, duration: 0.04, ease: 'power2.out'})
      timeline.to(root, {x: root.x, duration: 0.04, ease: 'power2.out'})

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
    for (const node of this.optionNodes.values()) {
      const affordable = this.game.economy.canAfford(node.price)
      node.affordable = affordable

      if (affordable) {
        node.root.cursor = 'pointer'
        node.root.alpha = 1
        node.disabledOverlay.alpha = 0

        node.badgeText.alpha = 1
        node.badgeCoin.alpha = 1
      } else {
        node.root.cursor = 'not-allowed'
        node.root.alpha = 0.75
        node.disabledOverlay.alpha = 0.22

        node.badgeText.alpha = 0.85
        node.badgeCoin.alpha = 0.85
      }
    }
  }

  private onSelect(type: TFarmEntity) {
    this.game.plotManager.buyFarmEntity(type)
  }
}
