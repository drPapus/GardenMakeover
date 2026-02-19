import {Application, Container} from 'pixi.js'
import {gsap} from 'gsap'

import {Game} from '../Core/Game'
import {MoneyBar} from './MoneyBar'
import {AddEntityMenu} from './AddEntityMenu'
import {SpendMoney} from './SpendMoney'
import {PlotGrowthProgress} from './PlotGrowthProgress'
import {CollectCoin} from './CollectCoin'
import {CareAction} from './CareAction'
import {DayNightToggle} from './DayNightToggle'
import {StageChangeParticles} from './StageChangeParticles'
import {Popup} from './Popup'
import {Tutorial} from './Tutorial'


export class UIManager {
  private game: Game
  private canvas: HTMLCanvasElement

  application!: Application
  stage!: Container

  moneyBar: MoneyBar
  addEntityMenu: AddEntityMenu
  spendMoney: SpendMoney
  plotGrowthProgress: PlotGrowthProgress
  collectCoin: CollectCoin
  careAction: CareAction
  dayNightToggle: DayNightToggle
  stageChangeParticles: StageChangeParticles
  popup: Popup
  tutorial: Tutorial

  constructor() {
    this.game = Game.getInstance()
    this.canvas = this.game.pixiCanvas

    this.moneyBar = new MoneyBar()
    this.addEntityMenu = new AddEntityMenu()
    this.spendMoney = new SpendMoney()
    this.plotGrowthProgress = new PlotGrowthProgress()
    this.collectCoin = new CollectCoin(this.moneyBar)
    this.careAction = new CareAction()
    this.dayNightToggle = new DayNightToggle()
    this.stageChangeParticles = new StageChangeParticles()
    this.popup = new Popup()
    this.tutorial = new Tutorial()

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
    this.stage.addChild(this.collectCoin.container)
    this.stage.addChild(this.stageChangeParticles.container)
    this.stage.addChild(this.careAction.container)
    this.stage.addChild(this.popup.container)
    this.stage.addChild(this.tutorial.container)
  }

  resize() {
    const {clientWidth, clientHeight} = this.game.canvasContainer

    this.application.renderer.resolution = Math.min(window.devicePixelRatio, 1.5)
    this.application.renderer.resize(clientWidth, clientHeight)

    this.dayNightToggle.resize()
    this.moneyBar.resize()
    this.addEntityMenu.resize()
    this.popup.resize()
  }

  render() {
    this.spendMoney.update()
    this.collectCoin.update()
    this.plotGrowthProgress.update()
    this.careAction.update()
    this.stageChangeParticles.update()
    this.tutorial.update()
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
