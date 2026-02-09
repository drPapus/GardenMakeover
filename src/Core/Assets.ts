import {EventDispatcher, Object3D} from 'three'
import type {GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'

import {Config} from './Config'


const loaders = {
  gltf: new GLTFLoader(),
}


export class Assets extends EventDispatcher<{ assetsLoaded: { type: 'assetsLoaded' } }> {
  loadedCount = 0
  assetsToLoadQty = Config.assets.length

  models: Record<string, GLTF | Object3D> = {}

  constructor() {
    super()

    for (const {url, name, loader, type} of Config.assets) {
      loaders[loader].load(url, (obj) => {
        switch (name) {
          case 'farmMain':
            this.#setModel({name, obj})
            break
          case 'objects': {
            for (const child of obj.scene.children) {
              this.#setModel({name: child.name, obj: child})
            }
          }
        }

        this.#increaseLoadedCount()
      })

    }
  }

  #setModel({name, obj}: { name: string, obj: GLTF | Object3D }) {
    this.models[name] = obj
  }

  #increaseLoadedCount() {
    this.loadedCount++
    if (this.assetsToLoadQty === this.loadedCount) this.dispatchEvent({type: 'assetsLoaded'})
  }
}