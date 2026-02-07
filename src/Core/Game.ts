import {Clock} from 'three'

import {World} from './World'
import {Assets} from './Assets'
import {FarmMain} from '../Entities/FarmMain'
import {Debug} from '../Utils/Debug'
import {PlotManager} from './PlotManager'
import {UIManager} from '../UI/UIManager'
import {Raycaster} from './Raycaster'
import {Economy} from './Economy'


export class Game {
  private static instance: Game | null = null
  canvasContainer: HTMLDivElement
  canvas: HTMLCanvasElement
  isDebugMode: boolean
  updatables: Record<string, (delta: number) => void> = {}

  clock: Clock
  debug!: Debug
  assets!: Assets
  world!: World
  raycaster!: Raycaster
  ground!: FarmMain
  plotManager!: PlotManager
  ui!: UIManager
  economy!: Economy

  private constructor(canvasContainer: HTMLDivElement) {
    this.canvasContainer = canvasContainer
    this.canvas = this.canvasContainer.querySelector('canvas')!
    this.isDebugMode = Boolean(new URLSearchParams(window.location.search).get('debug'))
    this.clock = new Clock()
  }

  public static getInstance(canvasContainer?: HTMLDivElement): Game {
    if (!Game.instance) {
      if (!canvasContainer) throw new Error('Game container is required on first init')

      Game.instance = new Game(canvasContainer)
    }

    return Game.instance
  }

  init() {
    this.assets = new Assets()
    this.world = new World()
    this.ground = new FarmMain()
    this.economy = new Economy()
    this.plotManager = new PlotManager()
    this.raycaster = new Raycaster()
    this.ui = new UIManager()

    this.onResize()

    this.initEvents()

    this.clock.start()
    this.world.renderer.setAnimationLoop(() => this.onUpdate())

    if (this.isDebugMode) this.debug = new Debug()
  }

  initEvents() {
    window.addEventListener('resize', () => this.onResize())
    this.canvas.addEventListener('pointerdown', e => {
      this.raycaster.onPointerDown(e)
    })
  }

  onUpdate() {
    const delta = this.clock.getDelta()

    for (const key in this.updatables) {
      this.updatables[key](delta)
    }
  }

  onResize() {
    this.world.resize()
  }
}
