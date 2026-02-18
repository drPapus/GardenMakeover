import {Color, DoubleSide, Mesh, MeshPhysicalMaterial, MeshStandardMaterial} from 'three'

import {Game} from '../Core/Game'
import {Assets} from '../Core/Assets'


export class FarmMain {
  private game: Game
  private assets: Assets

  constructor() {
    this.game = Game.getInstance()
    this.assets = this.game.assets

    this.assets.addEventListener('assetsLoaded', () => this.init())
  }

  init() {
    const farm = this.assets.models.farmMain

    farm.rotation.y = Math.PI / 2
    farm.name = 'farmMain'

    const materialCache = new Map()

    farm.traverse((obj) => {
      if (obj instanceof Mesh) {
        const preventCastShadow = obj.name.startsWith('terrain') || obj.parent?.name.startsWith('stone')

        obj.castShadow = !preventCastShadow
        obj.receiveShadow = true

        const oldMaterial = obj.material as MeshPhysicalMaterial
        const colorHex = oldMaterial.color.getHex()

        if (!materialCache.has(colorHex)) {
          materialCache.set(colorHex, new MeshStandardMaterial({
            color: new Color().copy(oldMaterial.color),
            side: DoubleSide,
            metalness: .1,
            roughness: .6,
            flatShading: true,
          }))
        }

        obj.material = materialCache.get(colorHex)
      }


    })

    this.game.world.scene.add(farm)
  }
}