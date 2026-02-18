import {Application, Container} from 'pixi.js'
import {gsap} from 'gsap'

import {Game} from '../Core/Game'
import {MoneyBar} from './MoneyBar'
import {AddEntityMenu} from './AddEntityMenu'
import {SpendMoney} from './SpendMoney'
import {PlotGrowthProgress} from './PlotGrowthProgress'
import {CollectCoinUI} from './CollectCoinUI'
import {CareActionUI} from './CareActionUi'
import {DayNightToggle} from './DayNightToggle'
import {StageChangeParticles} from './StageChangeParticles'
import {Popup} from './Popup'


export class UIManager {
  private game: Game
  private canvas: HTMLCanvasElement

  application!: Application
  stage!: Container

  moneyBar: MoneyBar
  addEntityMenu: AddEntityMenu
  spendMoney: SpendMoney
  plotGrowthProgress: PlotGrowthProgress
  collectCoinUI: CollectCoinUI
  careActionUI: CareActionUI
  dayNightToggle: DayNightToggle
  stageChangeParticles: StageChangeParticles
  popup: Popup

  constructor() {
    this.game = Game.getInstance()
    this.canvas = this.game.pixiCanvas

    this.moneyBar = new MoneyBar()
    this.addEntityMenu = new AddEntityMenu()
    this.spendMoney = new SpendMoney()
    this.plotGrowthProgress = new PlotGrowthProgress()
    this.collectCoinUI = new CollectCoinUI(this.moneyBar)
    this.careActionUI = new CareActionUI()
    this.dayNightToggle = new DayNightToggle()
    this.stageChangeParticles = new StageChangeParticles()
    this.popup = new Popup()

    this.game.assets.addEventListener('assetsLoaded', () => {
      this.hidePreloader()
    })
  }

  async init() {
    this.application = new Application()

    await this.application.init({
      canvas: this.canvas,
      autoStart: false,
      backgroundAlpha: 0,
      antialias: true,
    })

    this.stage = this.application.stage
    this.stage.eventMode = 'static'
    this.stage.interactiveChildren = true

    this.stage.addChild(this.spendMoney.container)
    this.stage.addChild(this.moneyBar.container)
    this.stage.addChild(this.dayNightToggle.container)
    this.stage.addChild(this.addEntityMenu.container)
    this.stage.addChild(this.plotGrowthProgress.container)
    this.stage.addChild(this.collectCoinUI.container)
    this.stage.addChild(this.careActionUI.container)
    this.stage.addChild(this.stageChangeParticles.container)
    this.stage.addChild(this.popup.container)
  }

  resize() {
    const {clientWidth, clientHeight} = this.game.canvasContainer

    this.application.renderer.resolution = Math.min(window.devicePixelRatio, 1.5)
    this.application.renderer.resize(clientWidth, clientHeight)

    this.dayNightToggle.resize()
    this.moneyBar.resize(clientWidth)
    this.addEntityMenu.resize(clientWidth, clientHeight)
    this.popup.resize(clientWidth, clientHeight)
  }

  render() {
    this.spendMoney.update()
    this.collectCoinUI.update()
    this.plotGrowthProgress.update()
    this.careActionUI.update()
    this.stageChangeParticles.update()
    this.application.renderer.render({
      container: this.stage,
      clear: false,
    })
  }

  handlePointerDown(pointerEvent: PointerEvent): boolean {
    const {left, top} = this.canvas.getBoundingClientRect()

    const hitDisplayObject = this.application.renderer.events.rootBoundary.hitTest(
      pointerEvent.clientX - left,
      pointerEvent.clientY - top,
    )

    return hitDisplayObject != null
  }

  handlePointerUp(pointerEvent: PointerEvent): boolean {
    const {left, top} = this.canvas.getBoundingClientRect()

    const hitDisplayObject = this.application.renderer.events.rootBoundary.hitTest(
      pointerEvent.clientX - left,
      pointerEvent.clientY - top,
    )

    return hitDisplayObject != null
  }

  hidePreloader() {
    const preloader = document.querySelector<HTMLDivElement>('.preloader')

    gsap.to(preloader, {
      opacity: 0,
      duration: .6,
      onComplete: () => {
        preloader!.style.display = 'none'
      },
    })
  }
}
