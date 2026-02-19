import {Vector3} from 'three'
import {Container, Sprite} from 'pixi.js'
import gsap from 'gsap'

import {Game} from '../Core/Game'
import {MoneyBar} from './MoneyBar'
import {Plot, TPlotID} from '../Entities/Plot'


type TSlot = {
  plot: Plot
  coinRoot: Container
  coinSprite: Sprite
  active: boolean
  bounceOffsetY: number
}


export class CollectCoin {
  private game: Game
  container: Container

  private moneyBar: MoneyBar

  private slots!: Record<TPlotID, TSlot>
  private tmpWorldPosition = new Vector3()
  private tmpProjectedPosition = new Vector3()
  private worldOffset: Vector3 = new Vector3(0, 0, 0)

  constructor(moneyBar: MoneyBar) {
    this.game = Game.getInstance()
    this.moneyBar = moneyBar

    this.container = new Container()
    this.container.eventMode = 'none'
    this.container.interactiveChildren = false

    this.slots = {} as CollectCoin['slots']

    this.game.plotManager.addEventListener('plotsInited', () => {
      for (const plot of this.game.plotManager.plots) {
        const coinRoot = new Container()
        coinRoot.eventMode = 'none'
        coinRoot.visible = false

        const coinTexture = this.game.assets.textures['money']
        const coin = new Sprite(coinTexture)
        coin.anchor.set(0.5)
        coin.width = 100
        coin.height = 100

        coinRoot.addChild(coin)

        this.container.addChild(coinRoot)

        this.slots[plot.id] = {
          plot,
          coinRoot,
          coinSprite: coin,
          active: false,
          bounceOffsetY: 0,
        }

        plot.addEventListener('ripe', () => this.showCoin(plot.id))
      }
    })
  }

  private showCoin(id: TPlotID) {
    const slot = this.slots[id]

    slot.active = true
    slot.coinRoot.visible = true
    slot.coinRoot.alpha = 1
    slot.coinRoot.scale.set(1)
    slot.bounceOffsetY = 0

    gsap.killTweensOf(slot)
    gsap.killTweensOf(slot.coinRoot)
    gsap.killTweensOf(slot.coinRoot.scale)

    gsap.to(slot, {
      bounceOffsetY: -10,
      duration: 0.55,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })

    gsap.fromTo(
      slot.coinRoot.scale,
      {x: 0.9, y: 0.9},
      {x: 1, y: 1, duration: 0.18, ease: 'back.out(2)'},
    )
  }

  collect(id: TPlotID) {
    const slot = this.slots[id]
    if (!slot.active) return

    slot.active = false

    gsap.killTweensOf(slot)
    gsap.killTweensOf(slot.coinRoot)
    gsap.killTweensOf(slot.coinRoot.scale)

    const startX = slot.coinRoot.x
    const startY = slot.coinRoot.y

    gsap.to(slot.coinRoot, {
      alpha: 0,
      duration: 0.12,
      ease: 'power1.out',
      onComplete: () => {
        slot.coinRoot.visible = false
        slot.coinRoot.alpha = 1
      },
    })

    this.playBurstToWallet(startX, startY)
  }

  private playBurstToWallet(startX: number, startY: number) {
    const walletPosition = this.getWalletGlobalPosition()
    if (!walletPosition) return

    const burstCount = 15
    const container = this.container

    for (let i = 0; i < burstCount; i++) {
      const burstCoin = new Sprite(this.game.assets.textures['money'])
      burstCoin.width = 10
      burstCoin.height = 10
      burstCoin.anchor.set(0.5)

      const finalScale = 0.3 //+ Math.random() * 0.4
      burstCoin.scale.set(0)
      burstCoin.x = startX
      burstCoin.y = startY
      container.addChild(burstCoin)

      const angle = Math.random() * Math.PI * 2
      const force = 60 + Math.random() * 80
      const burstX = startX + Math.cos(angle) * force
      const burstY = startY + Math.sin(angle) * force - 20

      const timeline = gsap.timeline({
        delay: Math.random() * 0.05,
        onComplete: () => {
          gsap.killTweensOf(burstCoin.scale)
          gsap.killTweensOf(burstCoin)
          burstCoin.destroy()
        },
      })

      timeline.to(burstCoin, {
        x: burstX,
        y: burstY,
        duration: 0.4,
        ease: 'power3.out',
      }, 0)

      timeline.to(burstCoin.scale, {
        x: finalScale,
        y: finalScale,
        duration: 0.2,
        ease: 'back.out(2)',
      }, 0)

      gsap.to(burstCoin.scale, {
        x: -finalScale,
        duration: 0.2 + Math.random() * 0.2,
        repeat: -1,
        yoyo: true,
        ease: 'none',
      })

      timeline.to(burstCoin, {
        y: burstY + 15,
        duration: 0.5,
        ease: 'sine.inOut',
      }, 0.4)

      const midX = (burstX + walletPosition.x) / 2 + (Math.random() - 0.5) * 150
      const midY = Math.min(burstY, walletPosition.y) - 100

      timeline.to(burstCoin, {
        duration: 0.6,
        ease: 'power2.in',
        // bezier: {
        //   values: [
        //     {x: burstX, y: burstY + 15},
        //     {x: midX, y: midY},
        //     {x: target.x, y: target.y},
        //   ],
        // },
        onUpdate: function () {
          const t = this.progress()
          if (t > 0) {
            const invT = 1 - t
            burstCoin.x = invT * invT * burstX + 2 * invT * t * midX + t * t * walletPosition.x
            burstCoin.y = invT * invT * (burstY + 15) + 2 * invT * t * midY + t * t * walletPosition.y
          }
        },
      }, 0.7 + (i * 0.02))

      timeline.to(burstCoin, {
        alpha: 0,
        duration: 0.1,
      }, '-=0.1')
    }

    this.animateWalletPunch()
  }

  private animateWalletPunch() {
    const icon = this.moneyBar.moneyIcon
    if (!icon) return

    const {x: baseScaleX, y: baseScaleY} = this.moneyBar.moneyIconBaseScale

    gsap.killTweensOf(icon.scale)
    icon.scale.set(baseScaleX, baseScaleY)

    gsap.to(icon.scale, {
      x: 1.3,
      y: 1.3,
      duration: 0.1,
      delay: 1.2,
      yoyo: true,
      repeat: 5,
      ease: 'power2.out',
    })
  }

  private getWalletGlobalPosition(): { x: number, y: number } | null {
    const icon = this.moneyBar.moneyIcon
    if (!icon) return null

    const {x, y} = icon.getGlobalPosition()

    return {x, y}
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
        slot.coinRoot.visible = false
        continue
      }

      const x = (this.tmpProjectedPosition.x + 1) * 0.5 * width
      const y = (-this.tmpProjectedPosition.y + 1) * 0.5 * height

      slot.coinRoot.visible = true
      slot.coinRoot.x = Math.round(x)
      slot.coinRoot.y = Math.round(y + slot.bounceOffsetY)
    }
  }
}
