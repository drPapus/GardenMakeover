import {Clock} from 'three'

import {World} from './World'
import {Assets} from './Assets'
import {FarmMain} from '../Entities/FarmMain'
import {Debug} from '../Utils/Debug'
import {PlotManager} from './PlotManager'
import {Raycaster} from './Raycaster'
import {Economy} from './Economy'
import {InputRouter} from './InputRouter'
import {UIManager} from '../UI/UIManager'


export class Game {
  private static instance: Game | null = null
  canvasContainer: HTMLDivElement
  threeCanvas: HTMLCanvasElement
  pixiCanvas: HTMLCanvasElement
  isDebugMode: boolean

  clock: Clock
  debug!: Debug
  assets!: Assets
  world!: World
  raycaster!: Raycaster
  farmMain!: FarmMain
  plotManager!: PlotManager
  economy!: Economy
  inputRouter!: InputRouter
  ui!: UIManager

  private constructor(canvasContainer: HTMLDivElement) {
    this.canvasContainer = canvasContainer
    const threeCanvas = this.canvasContainer.querySelector<HTMLCanvasElement>('#three-canvas')
    const pixiCanvas = this.canvasContainer.querySelector<HTMLCanvasElement>('#pixi-canvas')

    if (!threeCanvas) throw new Error('Three canvas not found')
    if (!pixiCanvas) throw new Error('Pixi canvas not found')

    this.threeCanvas = threeCanvas
    this.pixiCanvas = pixiCanvas

    this.isDebugMode = Boolean(new URLSearchParams(window.location.search).get('debug'))
    this.clock = new Clock()

  }

  static getInstance(canvasContainer?: HTMLDivElement): Game {
    if (!Game.instance) {
      if (!canvasContainer) throw new Error('Game container is required on first init')

      Game.instance = new Game(canvasContainer)
    }

    return Game.instance
  }

  async init() {
    this.assets = new Assets()
    this.world = new World()
    this.farmMain = new FarmMain()
    this.economy = new Economy()
    this.plotManager = new PlotManager()
    this.raycaster = new Raycaster()
    this.ui = new UIManager()
    await this.ui.init()
    this.inputRouter = new InputRouter()

    this.onResize()

    this.initEvents()

    this.clock.start()
    this.world.renderer.setAnimationLoop(() => this.onUpdate())

    if (this.isDebugMode) this.debug = new Debug()
  }

  initEvents() {
    window.addEventListener('resize', () => this.onResize())
  }

  onUpdate() {
    const delta = this.clock.getDelta()

    this.plotManager.update(delta)

    this.world.render()
    this.ui.render()
  }

  onResize() {
    this.world.resize()
    this.ui.resize()
  }
}
