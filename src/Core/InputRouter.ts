import {Game} from './Game'
import {World} from './World'
import {Raycaster} from './Raycaster'
import {UIManager} from '../UI/UIManager'


export class InputRouter {
  private game: Game
  private pixiCanvas: HTMLCanvasElement
  private world: World
  private raycaster: Raycaster
  private ui: UIManager

  private isPointerDown: boolean = false
  private isDragging: boolean = false

  private pointerStartClientX: number = 0
  private pointerStartClientY: number = 0
  private pointerLastClientX: number = 0
  private pointerLastClientY: number = 0

  private dragThresholdPixels: number = 8

  constructor() {
    this.game = Game.getInstance()
    this.pixiCanvas = this.game.pixiCanvas
    this.world = this.game.world
    this.raycaster = this.game.raycaster
    this.ui = this.game.ui

    this.initEvents()
  }

  initEvents() {
    this.pixiCanvas.addEventListener('pointerdown', this.onPointerDown, {passive: false})
    this.pixiCanvas.addEventListener('pointermove', this.onPointerMove, {passive: false})
    this.pixiCanvas.addEventListener('pointerup', this.onPointerUp, {passive: false})
    this.pixiCanvas.addEventListener('pointercancel', this.onPointerUp, {passive: false})
  }

  private onPointerDown = (event: PointerEvent) => {
    if (this.ui.handlePointerDown(event)) return

    this.isPointerDown = true
    this.isDragging = false

    this.pointerStartClientX = event.clientX
    this.pointerStartClientY = event.clientY
    this.pointerLastClientX = event.clientX
    this.pointerLastClientY = event.clientY
  }

  private onPointerMove = (event: PointerEvent) => {
    if (!this.isPointerDown) return

    const pointerTotalDeltaX = event.clientX - this.pointerStartClientX
    const pointerTotalDeltaY = event.clientY - this.pointerStartClientY

    if (!this.isDragging) {
      const pointerTotalDistancePixels: number = Math.hypot(pointerTotalDeltaX, pointerTotalDeltaY)

      if (pointerTotalDistancePixels <=this.dragThresholdPixels) return

      this.isDragging = true
    }

    const pointerDeltaX = event.clientX - this.pointerLastClientX
    const pointerDeltaY = event.clientY - this.pointerLastClientY

    this.pointerLastClientX = event.clientX
    this.pointerLastClientY = event.clientY

    this.world.panBy(pointerDeltaX, pointerDeltaY)
    event.preventDefault()
  }

  private onPointerUp = (event: PointerEvent) => {
    if (!this.isPointerDown) return

    if (this.ui.handlePointerUp(event)) {
      this.isPointerDown = false
      this.isDragging = false
      return
    }

    if (!this.isDragging) {
      this.raycaster.onPointerTap(event)
    }

    this.isPointerDown = false
    this.isDragging = false
  }
}
