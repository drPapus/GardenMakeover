import {Vector2, Raycaster as ThreeRaycaster, Mesh} from 'three'

import {Game} from './Game'
import {Plot} from '../Entities/Plot'


export class Raycaster {
  #game: Game
  raycaster: ThreeRaycaster
  pointer: Vector2
  intersectObjects: Mesh[] = []

  constructor() {
    this.#game = Game.getInstance()
    this.raycaster = new ThreeRaycaster()
    this.raycaster.layers.set(1)
    this.pointer = new Vector2()
  }

  onPointerDown(e: PointerEvent) {
    const {clientX, clientY} = e
    const {innerWidth, innerHeight} = window

    this.pointer.x = (clientX / innerWidth) * 2 - 1
    this.pointer.y = -(clientY / innerHeight) * 2 + 1

    this.raycaster.setFromCamera(this.pointer, this.#game.world.camera)

    const intersects = this.raycaster.intersectObjects(this.intersectObjects, false)

    if (intersects.length === 0) {
      this.#game.plotManager.hittedPlotId = null

      return
    }

    const hit = intersects[0].object
    this.#game.plotManager.hittedPlotId = hit.userData.plotId
  }
}