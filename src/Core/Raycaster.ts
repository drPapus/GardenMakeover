import {Vector2, Raycaster as ThreeRaycaster, Mesh} from 'three'

import {Game} from './Game'


export class Raycaster {
  private game: Game
  raycaster: ThreeRaycaster
  pointer: Vector2
  intersectObjects: Mesh[] = []

  constructor() {
    this.game = Game.getInstance()
    this.raycaster = new ThreeRaycaster()
    this.raycaster.layers.set(1)
    this.pointer = new Vector2()
  }

  onPointerTap(event: PointerEvent) {
    const {clientX, clientY} = event
    const {width, height} = this.game.canvasContainer.getBoundingClientRect()

    this.pointer.x = (clientX / width) * 2 - 1
    this.pointer.y = -(clientY / height) * 2 + 1

    this.raycaster.setFromCamera(this.pointer, this.game.world.camera)

    const intersects = this.raycaster.intersectObjects(this.intersectObjects, false)

    if (intersects.length === 0) {
      this.game.plotManager.setHittedPlot(null)

      return
    }

    const hit = intersects[0].object
    this.game.plotManager.setHittedPlot(hit.userData.plotId)
  }
}