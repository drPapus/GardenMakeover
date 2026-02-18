import * as THREE from 'three'
import {Container, Sprite} from 'pixi.js'
import gsap from 'gsap'
import {Game} from '../Core/Game'
import {MoneyBar} from './MoneyBar'
import {Plot, TPlotID} from '../Entities/Plot'


type SlotBinding = {
  object3D: THREE.Object3D | null
  slotEvents: EventTarget | null

  coinRoot: Container
  coinSprite: Sprite

  active: boolean
  bounceOffsetY: number

  onRipeHandler: (() => void) | null

  worldOffset: THREE.Vector3
}


export class CollectCoinUI {
  private game: Game
  private plots: Plot[] = []
  public container: Container

  private moneyBar: MoneyBar

  private slots: Record<TPlotID, SlotBinding> = {}
  private tmpWorldPos = new THREE.Vector3()
  private tmpProjected = new THREE.Vector3()

  constructor(moneyBar: MoneyBar) {
    this.game = Game.getInstance()
    this.moneyBar = moneyBar

    this.container = new Container()
    this.container.eventMode = 'static'
    this.container.interactiveChildren = true


    this.game.plotManager.addEventListener('plotsInited', () => {
      this.plots = this.game.plotManager.plots
      for (const plot of this.plots) {
        const coinRoot = new Container()
        coinRoot.eventMode = 'static'
        coinRoot.cursor = 'pointer'
        coinRoot.visible = false

        const coinTexture = this.game.assets.textures['money']
        const coin = new Sprite(coinTexture)
        coin.anchor.set(0.5)
        coin.width = 100
        coin.height = 100

        coinRoot.addChild(coin)

        coinRoot.on('pointerup', () => {
          console.log(plot.id)
          this.game.plotManager.sellFarmEntity(plot.id)
          this.collect(plot.id)
        })

        this.container.addChild(coinRoot)

        this.slots[plot.id] = {
          object3D: null,
          slotEvents: null,

          coinRoot,
          coinSprite: coin,

          active: false,
          bounceOffsetY: 0,

          onRipeHandler: null,

          worldOffset: new THREE.Vector3(0, 0.9, 0),
        }

        this.bindSlot(plot.id, plot.object, plot)
      }
    })
  }

  bindSlot(id: TPlotID, object3D: THREE.Object3D, slotEvents: EventTarget, worldOffsetY: number = 0.9) {
    const s = this.slots[id]

    if (s.slotEvents && s.onRipeHandler) {
      s.slotEvents.removeEventListener('ripe', s.onRipeHandler)
    }

    s.object3D = object3D
    s.slotEvents = slotEvents
    s.worldOffset.set(0, worldOffsetY, 0)

    const handler = () => this.showCoin(id)
    s.onRipeHandler = handler
    slotEvents.addEventListener('ripe', handler)
  }

  private showCoin(id: TPlotID) {
    const s = this.slots[id]
    if (!s.object3D) return

    s.active = true
    s.coinRoot.visible = true
    s.coinRoot.alpha = 1
    s.coinRoot.scale.set(1)
    s.bounceOffsetY = 0

    gsap.killTweensOf(s)
    gsap.killTweensOf(s.coinRoot)
    gsap.killTweensOf(s.coinRoot.scale)

    gsap.to(s, {
      bounceOffsetY: -10,
      duration: 0.55,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })

    gsap.fromTo(
      s.coinRoot.scale,
      {x: 0.9, y: 0.9},
      {x: 1, y: 1, duration: 0.18, ease: 'back.out(2)'},
    )
  }

  private collect(id: TPlotID) {
    const s = this.slots[id]
    if (!s.active) return

    s.active = false

    gsap.killTweensOf(s)
    gsap.killTweensOf(s.coinRoot)

    const startX = s.coinRoot.x
    const startY = s.coinRoot.y

    gsap.to(s.coinRoot, {
      alpha: 0,
      duration: 0.12,
      ease: 'power1.out',
      onComplete: () => {
        s.coinRoot.visible = false
        s.coinRoot.alpha = 1
      },
    })

    this.playBurstToWallet(startX, startY)
  }

 private playBurstToWallet(startX: number, startY: number) {
  const target = this.getWalletGlobalPosition();
  if (!target) return;

  const count = 15;
  const container = this.container;

  for (let i = 0; i < count; i++) {
    const sp = new Sprite(this.game.assets.textures['money']);
    sp.width = 10
    sp.height = 10
    sp.anchor.set(0.5);

    const finalScale = 0.3 //+ Math.random() * 0.4;
    sp.scale.set(0);
    sp.x = startX;
    sp.y = startY;
    container.addChild(sp);

    const angle = Math.random() * Math.PI * 2;
    const force = 60 + Math.random() * 80;
    const burstX = startX + Math.cos(angle) * force;
    const burstY = startY + Math.sin(angle) * force - 20;

    const tl = gsap.timeline({
      delay: Math.random() * 0.05,
      onComplete: () => sp.destroy()
    });

    tl.to(sp, {
      x: burstX,
      y: burstY,
      duration: 0.4,
      ease: "power3.out",
    }, 0);

    tl.to(sp.scale, {
      x: finalScale,
      y: finalScale,
      duration: 0.2,
      ease: "back.out(2)"
    }, 0);

    gsap.to(sp.scale, {
      x: -finalScale,
      duration: 0.2 + Math.random() * 0.2,
      repeat: -1,
      yoyo: true,
      ease: "none"
    });

    tl.to(sp, {
      y: burstY + 15,
      duration: 0.5,
      ease: "sine.inOut"
    }, 0.4);

    const midX = (burstX + target.x) / 2 + (Math.random() - 0.5) * 150;
    const midY = Math.min(burstY, target.y) - 100;

    tl.to(sp, {
      duration: 0.6,
      ease: "power2.in",
      bezier: {
        values: [
          { x: burstX, y: burstY + 15 },
          { x: midX, y: midY },
          { x: target.x, y: target.y }
        ]
      },
      onUpdate: function() {
        const t = this.progress();
        if (t > 0) {
          const invT = 1 - t;
          sp.x = invT * invT * burstX + 2 * invT * t * midX + t * t * target.x;
          sp.y = invT * invT * (burstY + 15) + 2 * invT * t * midY + t * t * target.y;
        }
      }
    }, 0.7 + (i * 0.02));

    tl.to(sp, {
      alpha: 0,
      duration: 0.1
    }, "-=0.1");
  }

  this.animateWalletPunch(target);
}

private animateWalletPunch(target: {x: number, y: number}) {
  const icon = (this.moneyBar as any).moneyIcon;
  if (!icon) return;

  gsap.to(icon.scale, {
    x: 1.3,
    y: 1.3,
    duration: 0.1,
    delay: 1.2,
    yoyo: true,
    repeat: 5,
    ease: "power2.out"
  });
}


  private getWalletGlobalPosition(): { x: number, y: number } | null {
    const icon = this.moneyBar.moneyIcon
    if (!icon) return null

    const p = icon.getGlobalPosition()
    return {x: p.x, y: p.y}
  }

  update = () => {
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
        s.coinRoot.visible = false
        continue
      }

      const x = (this.tmpProjected.x + 1) * 0.5 * w
      const y = (-this.tmpProjected.y + 1) * 0.5 * h

      s.coinRoot.visible = true
      s.coinRoot.x = x
      s.coinRoot.y = y + s.bounceOffsetY
    }
  }
}
