import {EventDispatcher} from 'three'
import {Game} from './Game'
import {Plot, TFarmEntity} from '../Entities/Plot'
import {Config} from './Config'
import {Economy} from './Economy'


type TEvents = {
  plotSelected: { type: 'plotSelected' }
  buySuccess: {type: 'buySuccess'}
}


export class PlotManager extends EventDispatcher<TEvents> {
  #game: Game
  #economy: Economy
  plots: Plot[] = []
  #hittedPlotId: number | null = null

  constructor() {
    super()

    this.#game = Game.getInstance()
    this.#economy = this.#game.economy

    this.#game.assets.addEventListener('assetsLoaded', () => this.init())
  }

  init() {
    for (const {id, position} of Config.plots) {
      this.plots.push(new Plot(id, position))
    }

    this.#game.updatables['plotManager'] = (delta: number) => this.update(delta)
  }

  update(delta: number) {
    for (const plot of this.plots) {
      plot.update(delta)
    }
  }

  get plotInfo() {
    if (this.#hittedPlotId === null) return undefined

    const plotType = this.plots.find(({id}) => id === this.#hittedPlotId)!.type
    return Config.farmEntities.find(({type}) => type === plotType)!
  }

  set hittedPlotId(id: number | null) {
    this.#hittedPlotId = id

    if (id === null) {
      for (const plot of this.plots) {
        plot.isSelected = false
      }

      this.#game.ui.plotBar.close()
    } else {
      for (const plot of this.plots) {
        if (plot.id === id) {
          const isSelectable = plot.isSelectable
          const isPlaceholder = plot.type === null

          if (!isSelectable) {
            plot.isSelected = false
            this.#game.ui.plotBar.close()
            continue
          }

          plot.isSelected = true

          const plotInfo = this.plotInfo

          this.#game.ui.plotBar.open(isPlaceholder ? 'add' : 'plot', plotInfo)
          this.dispatchEvent({type: 'plotSelected'})

          continue
        }

        plot.isSelected = false
      }
    }
  }

  buyFarmEntity(type: TFarmEntity) {
    const plot = this.plots.find(({id}) => id === this.#hittedPlotId)

    if (!plot) throw new Error('Plot not found')

    const price = Config.farmEntities.find(({type: _type}) => _type === type)!.price

    const isBuySuccess = this.#economy.spend(price)

    if (!isBuySuccess) {
      this.#game.ui.popup.open('Not enough money')
      return
    }

    this.#game.ui.plotBar.close()
    this.dispatchEvent({type: 'buySuccess'})

    for (const plot of this.plots) {
      plot.isSelected = false
    }

    plot.setFarmEntity(type, 'soil')
  }

  sellFarmEntity() {
    const plot = this.plots.find(({id}) => id === this.#hittedPlotId)

    if (!plot) throw new Error('Plot not found')

    const sellPrice = this.plotInfo!.sellPrice

    this.#economy.earn(sellPrice)
    this.#game.ui.plotBar.close()

    for (const plot of this.plots) {
      plot.isSelected = false
    }

    plot.setFarmEntity(null, 'ripe', true)
  }
}