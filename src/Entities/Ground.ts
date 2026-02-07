import {Game} from '../Core/Game'
import {Assets} from '../Core/Assets'
import {Group, Mesh} from 'three'


export class Ground {
  #game: Game
  #assets: Assets

  constructor() {
    this.#game = Game.getInstance()
    this.#assets = this.#game.assets

    this.#assets.addEventListener('assetsLoaded', () => this.init())
  }

  init() {
    const ground = this.#assets.models.ground!

    ground.scene.rotation.y = Math.PI / 2

    ground.scene.traverse((obj) => {
      if (obj instanceof Mesh) {
        const preventCastShadow = obj.name.startsWith('terrain') || obj.parent?.name.startsWith('stone')

        obj.castShadow = !preventCastShadow
        obj.receiveShadow = true
      }
    })

    this.#game.world.scene.add(ground.scene)

  }
}