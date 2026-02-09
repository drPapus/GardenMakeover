import {gsap} from 'gsap'

import {Config} from '../Core/Config'
import {Game} from '../Core/Game'
import {TFarmEntity} from '../Entities/Plot'


type TbarMode = 'add' | 'plot'
type TplotInfo = { name: string, sellPrice: number, type: TFarmEntity }


export class PlotBar {
  #game: Game
  bar: HTMLDivElement
  title: HTMLDivElement
  content: HTMLDivElement
  list: HTMLDivElement
  sellBtn: HTMLButtonElement
  tl!: gsap.core.Timeline
  isOpen: boolean = false
  mode: TbarMode = 'add'

  constructor() {
    this.#game = Game.getInstance()

    this.bar = document.createElement('div')
    this.bar.className = 'plot-bar'

    const header = document.createElement('div')
    header.className = 'plot-bar__header'

    this.title = document.createElement('div')
    this.title.className = 'plot-bar__title'

    const closeBtn = document.createElement('button')
    closeBtn.className = 'plot-bar__close'
    closeBtn.textContent = 'Close'
    closeBtn.addEventListener('click', () => {
      this.close()
      this.#game.plotManager.hittedPlotId = null
    })

    header.append(this.title, closeBtn)

    this.content = document.createElement('div')
    this.content.className = 'plot-bar__content'

    this.sellBtn = document.createElement('button')
    this.sellBtn.className = 'plot-bar__sell'
    this.sellBtn.addEventListener('click', () => this.#game.plotManager.sellFarmEntity())

    this.list = document.createElement('div')
    this.list.className = 'plot-bar__list'

    this.list.innerHTML = Config.farmEntities.map(({type, name, price}) =>
      `<button class="plot-bar__farm-card" data-entity-type="${type}">` +
      `<div class="plot-bar__preview"><img src="assets/images/farm-entities/${type}.png" class="plot-bar__preview" alt="${name}"/></div>` +
      `<div class="plot-bar__meta">` +
      `<span class="plot-bar__name">${name}</span>` +
      `<span class="plot-bar__price">${price}</span>` +
      `</div>` +
      `</button>`,
    ).join('')

    this.list.addEventListener('click', e => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-entity-type]')

      if (!el) return

      const type = el.dataset.entityType as TFarmEntity

      this.#game.plotManager.buyFarmEntity(type)
    })

    this.bar.append(header, this.content)

    document.getElementById('app')?.append(this.bar)

    this.initAnimation()
  }

  initAnimation() {
    gsap.set(this.bar, {
      y: 140,
      opacity: 0,
      pointerEvents: 'none'
    })

    this.tl = gsap.timeline({paused: true})

    this.tl
      .to(this.bar, {
        opacity: 1,
        duration: .1,
        ease: 'linear',
        onStart: () => {
          this.bar.style.pointerEvents = 'auto'
        }
      }, 0)
      .to(this.bar, {
        y: 0,
        duration: .35,
        ease: 'power3.out',
      }, 0)

    this.tl.eventCallback('onReverseComplete', () => {
      this.bar.style.pointerEvents = 'none'
    })
  }

  open(mode: 'add' | 'plot', plotInfo?: TplotInfo) {
    if (this.isOpen && (this.mode === 'add' && this.mode === mode)) return

    this.mode = mode
    this.isOpen = true
    this.content.innerHTML = ''

    if (mode === 'add') {
      this.title.textContent = 'Choose what to place'
      this.content.append(this.list)
    } else {
      if (!plotInfo) throw new Error('No info')

      const {name, sellPrice} = plotInfo

      this.content.append(this.sellBtn)
      this.title.textContent = name
      this.sellBtn.textContent = `Sell for ${sellPrice}`
    }

    this.tl.timeScale(1).play(0)
  }

  close() {
    if (!this.isOpen) return
    this.isOpen = false

    this.tl.timeScale(1.2).reverse()
  }
}
