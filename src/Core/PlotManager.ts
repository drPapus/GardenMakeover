import {Color, EventDispatcher, Mesh, MeshPhysicalMaterial, MeshStandardMaterial} from 'three'
import {Game} from './Game'
import {Plot, TFarmEntity, TPlotID} from '../Entities/Plot'
import {Config} from './Config'
import {Economy} from './Economy'


type TEvents = {
  plotSelected: { type: 'plotSelected', action: number }
  buySuccess: { type: 'buySuccess' }
  plotsInited: { type: 'plotsInited' }
  sellSuccess: { type: 'sellSuccess' }
}


export class PlotManager extends EventDispatcher<TEvents> {
  private game: Game
  private economy: Economy
  plots: Plot[] = []
  private hittedPlotId: TPlotID | null = null

  constructor() {
    super()

    this.game = Game.getInstance()
    this.economy = this.game.economy

    this.game.assets.addEventListener('assetsLoaded', () => this.init())
  }

  init() {
    for (const {id, position} of Config.plots) {
      this.plots.push(new Plot(id, position))
    }

    this.preparePlotMaterials()
    this.dispatchEvent({type: 'plotsInited'})
  }

  private preparePlotMaterials() {
    const toPrepare = [
      'placeholder', 'ground', 'fence',
      'chicken_1', 'cow_1', 'sheep_1',
      'corn_1', 'corn_2', 'corn_3',
      'grape_1', 'grape_2', 'grape_3',
      'strawberry_1', 'strawberry_2', 'strawberry_3',
      'tomato_1', 'tomato_2', 'tomato_3',
    ]

    const materialCache = new Map()

    for (const modelName of toPrepare) {
      const obj = this.game.assets.models[modelName]

      obj.traverse(child => {
        if (child instanceof Mesh) {
          child.castShadow = true

          const oldMaterial = child.material as MeshPhysicalMaterial
          const colorHex = oldMaterial.color.getHex()

          if (!materialCache.has(colorHex)) {
            materialCache.set(colorHex, new MeshStandardMaterial({
              color: new Color().copy(oldMaterial.color),
              metalness: .1,
              roughness: .6,
              flatShading: true,
            }))
          }

          child.material = materialCache.get(colorHex)
        }
      })
    }
  }

  update(delta: number) {
    for (const plot of this.plots) {
      plot.update(delta)
    }
  }

  getPlotInfo(id: TPlotID | null) {
    if (id === null) return undefined

    const plot = this.plots.find(({id: _id}) => _id === id)
    if (!plot) return undefined

    return Config.farmEntities.find(({type}) => type === plot.type)
  }

  setHittedPlot(id: TPlotID | null) {
    this.hittedPlotId = id

    for (const plot of this.plots) {
      plot.setSelected(false)
    }

    if (id === null) {
      this.game.ui.addEntityMenu.close()
      this.game.world.restoreCamera()
      return
    }

    const plot = this.plots.find(plot => plot.id === id)
    if (!plot) return

    if (plot.needsCare) {
      plot.applyCare()
      this.game.ui.careAction.hide(id)
      return
    }

    if (plot.isAlreadyRipe) {
      this.sellFarmEntity(plot.id)
      this.game.ui.collectCoin.collect(plot.id)
      return
    }

    if (!plot.isSelectable) {
      this.game.ui.addEntityMenu.close()
      this.game.world.restoreCamera()
      return
    }

    plot.setSelected(true)

    if (plot.type === null) {
      this.game.ui.addEntityMenu.open()
      this.game.world.focusCameraOnPoint(plot.position)
    }

    this.dispatchEvent({type: 'plotSelected', action: plot.id})
  }

  buyFarmEntity(type: TFarmEntity) {
    const plot = this.plots.find(({id}) => id === this.hittedPlotId)

    if (!plot) throw new Error('Plot not found')

    const price = Config.farmEntities.find(entity => entity.type === type)!.price

    const isBuySuccess = this.economy.spend(price)

    if (!isBuySuccess) {
      this.game.ui.popup.open('Not enough money')
      return
    }

    this.game.ui.addEntityMenu.close()
    this.game.ui.spendMoney.play(plot.id, price)
    this.dispatchEvent({type: 'buySuccess'})

    for (const plot of this.plots) {
      plot.setSelected(false)
    }

    plot.setFarmEntity(type, 'soil')
  }

  sellFarmEntity(id: TPlotID) {
    const plot = this.plots.find((plot) => id === plot.id)

    if (!plot) throw new Error('Plot not found')

    const sellPrice = this.getPlotInfo(id)!.sellPrice

    this.economy.earn(sellPrice)

    for (const plot of this.plots) {
      plot.setSelected(false)
    }

    this.dispatchEvent({type: 'sellSuccess'})

    plot.setFarmEntity(null, 'ripe', true)
  }
}