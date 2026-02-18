import {EventDispatcher, Mesh, Object3D} from 'three'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {Assets as PixiAssets, Texture} from 'pixi.js'

import {Config} from './Config'


const gltfLoader = new GLTFLoader()


export class Assets extends EventDispatcher<{ assetsLoaded: { type: 'assetsLoaded' } }> {
  loadedCount: number = 0
  totalAssets: number = Config.assets.length

  models: Record<string, Object3D> = {}
  textures: Record<string, Texture> = {}

  constructor() {
    super()

    for (const {url, name, loader, type} of Config.assets) {
      switch (loader) {
        case 'pixi':
          PixiAssets.add({alias: name, src: url})
          PixiAssets.load(name)
            .then(resource => {
              this.textures[name] = resource as Texture
              this.increaseLoadedCount()
            })
            .catch(() => {
              console.error(`Failed to load pixi asset: ${name}`)
            })
          break

        case 'gltf':
          gltfLoader.load(
            url,
            (obj) => {
              switch (name) {
                case 'farmMain':
                  this.setModel({name, obj: obj.scene})
                  break
                case 'objects': {
                  for (const child of obj.scene.children) {
                    this.setModel({name: child.name, obj: child})
                  }
                }
              }

              this.increaseLoadedCount()
            },
            undefined,
            () => {
              console.error(`Failed to load gltf: ${name}`)
            },
          )
          break
      }
    }
  }

  private setModel({name, obj}: { name: string, obj: Object3D }) {
    this.models[name] = obj
  }

  private increaseLoadedCount() {
    this.loadedCount++
    if (this.totalAssets === this.loadedCount) this.dispatchEvent({type: 'assetsLoaded'})
  }
}