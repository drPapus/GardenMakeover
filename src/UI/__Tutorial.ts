import {Vector3} from 'three'
import {Game} from '../Core/Game'


type TPoint = { x: number, y: number }
type TStep = 'tapPlot' | 'choose' | 'done'


export class __Tutorial {
  #game: Game
  root: HTMLDivElement
  pointer: HTMLDivElement
  hand: HTMLDivElement
  info: HTMLDivElement
  step: TStep = 'tapPlot'
  targetPlotId: number | null = null
  #onPlotSelected: () => void
  #onBought: () => void

  constructor() {
    this.#game = Game.getInstance()

    this.root = document.createElement('div')
    this.root.className = 'tutorial'
    this.root.innerHTML =
      '<div class="tutorial__pointer">' +
      '<div class="tutorial__hand"></div>' +
      '<div class="tutorial__info"></div>' +
      '</div>'

    this.pointer = this.root.querySelector('.tutorial__pointer') as HTMLDivElement
    this.hand = this.root.querySelector('.tutorial__hand') as HTMLDivElement
    this.info = this.root.querySelector('.tutorial__info') as HTMLDivElement

    document.body.append(this.root)
    this.hide()

    this.#game.assets.addEventListener('assetsLoaded', () => {
      const firstPlot = this.#game.plotManager.plots[0]
      this.targetPlotId = firstPlot ? firstPlot.id : null
      this.step = 'tapPlot'
      this.show('Tap an empty plot')
    })

    this.#onPlotSelected = () => this.onPlotSelected()
    this.#onBought = () => this.onBought()

    this.#game.plotManager.addEventListener('plotSelected', this.#onPlotSelected)

    this.#game.plotManager.addEventListener('buySuccess', this.#onBought)
  }

  update() {
    if (!this.targetPlotId) return
    if (this.step === 'done') return

    if (this.step === 'tapPlot') {
      const plot = this.#game.plotManager.plots.find(p => p.id === this.targetPlotId)
      if (!plot) return

      const wpos = plot.object.getWorldPosition(new Vector3())
      wpos.y -= 2

      const pt = this.#worldToScreen(wpos)
      this.setTargetScreen(pt)

      return
    }

    if (this.step === 'choose') {
      const target = this.#game.ui.plotBar.bar

      if (!target) return
      this.setTargetElement(target)
    }
  }

  onPlotSelected() {
    this.step = 'choose'
    this.setText('Choose a crop')
    this.#game.plotManager.removeEventListener('plotSelected', this.#onPlotSelected)
  }

  onBought() {
    this.step = 'done'
    this.hide()
    this.#game.ui.popup.open('Well done! Let’s keep farming 🚜')
    this.#game.plotManager.removeEventListener('buySuccess', this.#onBought)
    // delete this.#game.updatables['tutorial']
  }

  show(text: string) {
    this.root.style.display = 'block'
    this.setText(text)
  }

  hide() {
    this.root.style.display = 'none'
  }

  setText(text: string) {
    this.info.textContent = text
  }

  setTargetScreen(pt: TPoint) {
    this.pointer.style.transform = `translate(${pt.x + 22}px, ${pt.y - 34}px)`
    this.pointer.setAttribute('data-step', this.step)
  }

  setTargetElement(el: HTMLElement) {
    const r = el.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top
    this.setTargetScreen({x, y})
  }

  #worldToScreen(pos: Vector3): TPoint {
    const cam = this.#game.world.camera
    const canvas = this.#game.canvas

    const v = pos.clone().project(cam)
    const x = (v.x * 0.5 + 0.5) * canvas.clientWidth
    const y = (-v.y * 0.5 + 0.5) * canvas.clientHeight

    return {x, y}
  }
}
