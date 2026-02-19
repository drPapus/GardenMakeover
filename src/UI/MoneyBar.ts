import gsap from 'gsap'
import {
  Container,
  Graphics,
  Sprite,
  Text,
  Texture,
} from 'pixi.js'

import {Game} from '../Core/Game'
import {Assets} from '../Core/Assets'
import {Config} from '../Core/Config'


export class MoneyBar {
  private game: Game
  private assets: Assets

  container: Container
  moneyIcon!: Sprite
  moneyIconBaseScale: { x: number, y: number } = {x: 1, y: 1}

  private capsuleContainer: Container

  private valueText!: Text
  private valueCurrent: number = 0

  private barWidth: number = 150
  private barHeight: number = 34

  private marginTop: number = 12
  private marginRight: number = 12

  constructor() {
    this.game = Game.getInstance()
    this.assets = this.game.assets

    this.container = new Container()
    this.container.eventMode = 'none'

    this.capsuleContainer = new Container()

    this.container.addChild(this.capsuleContainer)

    this.game.assets.addEventListener('assetsLoaded', () => {
      this.buildCapsule()
    })
  }

  private buildCapsule() {
    const capsuleBackground = new Graphics()
    capsuleBackground.roundRect(0, 0, this.barWidth, this.barHeight, 18)
    capsuleBackground.fill(0x6a3a18)

    const capsuleInner = new Graphics()
    capsuleInner.roundRect(2, 2, this.barWidth - 4, this.barHeight - 6, 16)
    capsuleInner.fill('#8a4a1d')
    capsuleInner.alpha = 0.55

    const moneyTexture: Texture = this.assets.textures['money']
    const coinSprite = new Sprite(moneyTexture)
    coinSprite.anchor.set(0.5)
    coinSprite.x = 30
    coinSprite.y = this.barHeight / 2
    coinSprite.width = 50
    coinSprite.height = 50
    this.moneyIcon = coinSprite

    this.moneyIconBaseScale = {x: coinSprite.scale.x, y: coinSprite.scale.y}

    const valueText = new Text({
      text: Config.startMoney,
      style: {
        fill: '#ffffff',
        fontSize: 18,
        fontWeight: '800',
        dropShadow: {
          color: '#000000',
          blur: 2,
          distance: 1,
          alpha: .35,
        },
      },
    })
    valueText.anchor.set(1, 0.5)
    valueText.x = this.barWidth - 12
    valueText.y = this.barHeight / 2

    this.capsuleContainer.addChild(capsuleBackground)
    this.capsuleContainer.addChild(capsuleInner)
    this.capsuleContainer.addChild(coinSprite)
    this.capsuleContainer.addChild(valueText)

    this.valueText = valueText
  }

  resize() {
    const {width} = this.game.ui.application.screen
    const totalWidth: number = this.barWidth + 8 + 30

    this.container.x = width - totalWidth - this.marginRight
    this.container.y = this.marginTop
  }

  setMoney(nextMoneyValue: number, animate: boolean = true) {
    if (!animate) {
      this.valueCurrent = nextMoneyValue
      this.valueText.text = String(nextMoneyValue)
      return
    }

    gsap.killTweensOf(this)

    gsap.to(this, {
      valueCurrent: nextMoneyValue,
      duration: 3,
      ease: 'power2.out',
      onUpdate: () => {
        this.valueText.text = String(Math.round(this.valueCurrent))
      },
    })
  }
}
