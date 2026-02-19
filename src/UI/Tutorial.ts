import {Container, Text, Sprite} from 'pixi.js'
import {Vector3} from 'three'
import gsap from 'gsap'

import {Game} from '../Core/Game'
import {Plot, TCareAction, TPlotEvents} from '../Entities/Plot'


export type TVector2 = { x: number, y: number }

export type TTutorialStep = 'tapPlot' | 'chooseItem' | 'needCare' | 'sell' | 'done'

const TUTORIAL_TEXT = {
  tapPlot: 'Tap an empty plot',
  chooseItem: 'Choose a crop',
  needWatering: 'Tap to water',
  needFeed: 'Tap to feed',
  sell: 'Tap to Sell',
  done: 'Well done! Let’s keep farming 🚜',
} as const


export class Tutorial {
  private game: Game
  private plot?: Plot
  container = new Container()

  step: TTutorialStep = 'tapPlot'

  private tmpPlotWorldPosition: Vector3 = new Vector3()
  private tmpPlotProjectedPosition: Vector3 = new Vector3()

  private worldOffset: Vector3 = new Vector3(0, 3, -2)

  private textOffset: { x: number, y: number } = {x: 60, y: -40}
  private pointerOffset: { x: number, y: number } = {x: 0, y: 0}

  private handTimeline?: gsap.core.Timeline

  private pointer: Container
  private hand!: Sprite
  private info: Text

  private visible: boolean = false

  private onNeedsCare: (e: TPlotEvents['needsCare']) => void
  private onCareDone: () => void
  private onRipe: () => void
  private onPlotSelected: () => void
  private onBuySuccess: () => void
  private onSellSuccess: () => void

  constructor() {
    this.game = Game.getInstance()

    this.container.sortableChildren = true
    this.container.eventMode = 'none'

    this.pointer = new Container()
    this.pointer.zIndex = 9999
    this.pointer.eventMode = 'none'
    this.container.addChild(this.pointer)

    this.onNeedsCare = (e) => {
      this.show()
      this.initNeedCare(e.action)
    }
    this.onCareDone = () => this.hide()
    this.onRipe = () => {
      this.show()
      this.initNeedSell()
    }
    this.onPlotSelected = () => this.initChooseItem()
    this.onBuySuccess = () => {
      this.step = 'needCare'
      this.hide()
    }
    this.onSellSuccess = () => {
      this.hide()
      this.initDone()
    }

    this.game.plotManager.addEventListener('plotsInited', () => {
      this.plot = this.game.plotManager.plots[0]

      this.hand = new Sprite(this.game.assets.textures['hand'])
      this.hand.width = 80
      this.hand.height = 80
      this.hand.anchor.set(0, 0)
      this.pointer.addChild(this.hand)

      this.createHandAnimation()
      this.initTapPlot()

      this.plot.addEventListener('needsCare', this.onNeedsCare)
      this.plot.addEventListener('careDone', this.onCareDone)
      this.plot.addEventListener('ripe', this.onRipe)
    })

    this.info = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 34,
        fontWeight: '800',
        fill: '#ffffff',
        stroke: {color: '#5c3b1e', width: 4},
        dropShadow: {
          color: '#3a2412',
          blur: 4,
          distance: 2,
          alpha: 0.7,
        },
        wordWrap: true,
        wordWrapWidth: 300,
        align: 'center',
      },
    })
    this.info.anchor.set(0, 0)
    this.pointer.addChild(this.info)

    const tOff = this.textOffset
    this.info.position.set(tOff.x, tOff.y)

    this.hide()

    this.game.plotManager.addEventListener('plotSelected', this.onPlotSelected)
    this.game.plotManager.addEventListener('buySuccess', this.onBuySuccess)
    this.game.plotManager.addEventListener('sellSuccess', this.onSellSuccess)
  }

  update() {
    if (this.step === 'done') return
    if (!this.plot) return
    if (!this.visible) return

    const {width, height} = this.game.ui.application.screen

    if (this.step === 'tapPlot' || this.step === 'needCare' || this.step === 'sell') {
      this.plot.getWorldPositionWithOffset(this.tmpPlotWorldPosition, this.worldOffset)
      this.tmpPlotProjectedPosition.copy(this.tmpPlotWorldPosition).project(this.game.world.camera)

      const x = Math.round((this.tmpPlotProjectedPosition.x + 1) * 0.5 * width)
      const y = Math.round((-this.tmpPlotProjectedPosition.y + 1) * 0.5 * height)

      this.setTargetScreen({x, y})
      return
    }

    if (this.step === 'chooseItem') {
      const optionsContainer = this.game.ui.addEntityMenu.optionsContainer.children[0]
      const {x, y} = optionsContainer.getGlobalPosition()
      this.setTargetScreen({x, y: y - 110})
    }
  }

  private createHandAnimation() {
    if (!this.hand) return

    this.handTimeline?.kill()

    const baseY = this.hand.y
    const baseX = this.hand.x

    this.handTimeline = gsap.timeline({
      repeat: -1,
      defaults: {ease: 'sine.inOut'},
    })

    this.handTimeline
      .to(this.hand, {
        y: baseY - 6,
        x: baseX + 3,
        duration: 0.4,
      })
      .to(this.hand, {
        y: baseY,
        x: baseX,
        duration: 0.4,
      })
  }

  initTapPlot() {
    this.step = 'tapPlot'
    this.setText(TUTORIAL_TEXT.tapPlot)
    this.show()
  }

  initChooseItem() {
    this.step = 'chooseItem'

    this.textOffset = {x: -100, y: -45}

    this.info.position.set(this.textOffset.x, this.textOffset.y)

    this.setText(TUTORIAL_TEXT.chooseItem)
  }

  initNeedCare(action: TCareAction) {
    this.step = 'needCare'

    this.textOffset = {x: 60, y: -40}
    this.pointerOffset = {x: 0, y: 0}

    this.info.position.set(this.textOffset.x, this.textOffset.y)

    this.setText(action === 'water' ? TUTORIAL_TEXT.needWatering : TUTORIAL_TEXT.needFeed)
  }

  initNeedSell() {
    this.step = 'sell'
    this.setText(TUTORIAL_TEXT.sell)
  }

  initDone() {
    this.step = 'done'
    this.game.ui.popup.open(TUTORIAL_TEXT.done)

    this.game.plotManager.removeEventListener('plotSelected', this.onPlotSelected)
    this.game.plotManager.removeEventListener('sellSuccess', this.onSellSuccess)
    this.game.plotManager.removeEventListener('buySuccess', this.onBuySuccess)

    this.plot?.removeEventListener('needsCare', this.onNeedsCare)
    this.plot?.removeEventListener('careDone', this.onCareDone)
    this.plot?.removeEventListener('ripe', this.onRipe)
  }

  show() {
    this.visible = true
    this.container.visible = true
  }

  hide() {
    this.visible = false
    this.container.visible = false
  }

  setText(text: string) {
    this.info.text = text
  }

  setTargetScreen(pt: TVector2) {
    const {x: offsetX, y: offsetY} = this.pointerOffset
    this.pointer.position.set(pt.x + offsetX, pt.y + offsetY)
  }
}
