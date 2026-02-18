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

  private capsuleContainer: Container
  private plusButtonContainer: Container

  private valueText!: Text
  private valueCurrent: number = 0

  private capsuleWidth: number = 170
  private capsuleHeight: number = 44

  private marginTop: number = 12
  private marginRight: number = 12

  constructor() {
    this.game = Game.getInstance()
    this.assets = this.game.assets

    this.container = new Container()
    this.container.eventMode = 'none'

    this.capsuleContainer = new Container()
    this.plusButtonContainer = new Container()

    this.container.addChild(this.capsuleContainer)
    this.container.addChild(this.plusButtonContainer)

    this.game.assets.addEventListener('assetsLoaded', () => {
      this.buildCapsule()
    })
  }

  private buildCapsule() {
    const capsuleBackground = new Graphics()
    capsuleBackground.roundRect(0, 0, this.capsuleWidth, this.capsuleHeight, 18)
    capsuleBackground.fill(0x6a3a18)

    const capsuleInner = new Graphics()
    capsuleInner.roundRect(2, 2, this.capsuleWidth - 4, this.capsuleHeight - 6, 16)
    capsuleInner.fill(0x8a4a1d)
    capsuleInner.alpha = 0.55

    const capsuleHighlight = new Graphics()
    capsuleHighlight.roundRect(6, 5, this.capsuleWidth - 12, 14, 10)
    capsuleHighlight.fill(0xffffff)
    capsuleHighlight.alpha = 0.12

    const moneyTexture: Texture = this.assets.textures['money']
    const coinSprite = new Sprite(moneyTexture)
    this.moneyIcon = coinSprite

    if (coinSprite) {
      coinSprite.anchor.set(0.5)
      coinSprite.x = 22
      coinSprite.y = this.capsuleHeight / 2
      coinSprite.width = 26
      coinSprite.height = 26
    }

    const valueText = new Text({
      text: Config.startMoney,
      style: {
        fill: 0xffffff,
        fontSize: 18,
        fontWeight: '800',
        dropShadow: {
          color: '#000000',
          blur: 2,
          distance: 1,
          alpha: .35
        }
      },
    })
    valueText.anchor.set(1, 0.5)
    valueText.x = this.capsuleWidth - 12
    valueText.y = this.capsuleHeight / 2

    this.capsuleContainer.addChild(capsuleBackground)
    this.capsuleContainer.addChild(capsuleInner)
    this.capsuleContainer.addChild(capsuleHighlight)
    if (coinSprite) this.capsuleContainer.addChild(coinSprite)
    this.capsuleContainer.addChild(valueText)

    this.valueText = valueText
  }

  resize(viewportWidth: number) {
    const totalWidth: number = this.capsuleWidth + 8 + 30

    this.container.x = viewportWidth - totalWidth - this.marginRight
    this.container.y = this.marginTop
  }

  setMoneyAmount(nextMoneyValue: number, animate: boolean = true) {
    if (!animate) {
      this.valueCurrent = nextMoneyValue
      this.valueText.text = String(nextMoneyValue)
      return
    }

    gsap.killTweensOf(this)

    gsap.to(this, {
      valueCurrent: nextMoneyValue,
      duration: 0.35,
      ease: 'power2.out',
      onUpdate: () => {
        this.valueText.text = String(Math.round(this.valueCurrent))
      },
    })

    gsap.fromTo(
      this.capsuleContainer.scale,
      {x: 1, y: 1},
      {x: 1.05, y: 1.05, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out'},
    )
  }
}
