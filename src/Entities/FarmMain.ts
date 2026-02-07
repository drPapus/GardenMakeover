import {Game} from '../Core/Game'
import {Assets} from '../Core/Assets'
import {Group, Mesh} from 'three'
import {GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js'


export class FarmMain {
  #game: Game
  #assets: Assets

  constructor() {
    this.#game = Game.getInstance()
    this.#assets = this.#game.assets

    this.#assets.addEventListener('assetsLoaded', () => this.init())
  }

  init() {
    const farm = this.#assets.models.farmMain as GLTF

    farm.scene.rotation.y = Math.PI / 2

    farm.scene.traverse((obj) => {
      if (obj instanceof Mesh) {
        const preventCastShadow = obj.name.startsWith('terrain') || obj.parent?.name.startsWith('stone')

        obj.castShadow = !preventCastShadow
        obj.receiveShadow = true
      }
    })

    this.#game.world.scene.add(farm.scene)
  }
}