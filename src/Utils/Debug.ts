import {AxesHelper, Color, DirectionalLightHelper, PerspectiveCamera, Vector3} from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {GUI} from 'dat.gui'

import {Game} from '../Core/Game'
import {Config} from '../Core/Config'


const vec3Key = ['x', 'y', 'z'] as const


export class Debug {
  #game: Game
  dat: GUI
  #stats: Stats
  #orbitControls?: OrbitControls

  constructor() {
    this.#game = Game.getInstance()

    this.dat = new GUI()

    this.#stats = new Stats()
    document.body.append(this.#stats.dom)

    this.initCameraDebug()
    this.initLightsDebug()
    this.initHelpers()
    this.initPlotsDebug()

    this.#game.updatables['debug'] = () => this.update()
  }

  update() {
    this.#orbitControls?.update()
    this.#stats.update()
  }

  initHelpers() {
    const directionalLightHelper = new DirectionalLightHelper(this.#game.world.directionalLight, 5)
    this.#game.world.scene.add(directionalLightHelper)

    const axesHelper = new AxesHelper(20)
    this.#game.world.scene.add(axesHelper)

    // this.#orbitControls = new OrbitControls(this.#game.world.camera, this.#game.canvas)
  }

  initCameraDebug() {
    const camera = this.#game.world.camera

    const folder = this.dat.addFolder('Camera')

    for (const axis of vec3Key) {
      folder
        .add(camera.position, axis)
        .name(`Pos ${axis}`)
        .min(-100)
        .max(100)
        .step(.1)
    }

    for (const axis of vec3Key) {
      folder
        .add(camera.rotation, axis)
        .name(`Rotat ${axis}`)
        .min(-Math.PI)
        .max(Math.PI)
        .step(.01)
    }

    for (const cfgName of ['fov', 'far', 'near']) {
      folder
        .add(camera, cfgName as keyof PerspectiveCamera)
        .name(cfgName)
        .min(.01)
        .max(200)
        .step(.01)
        .onChange(() => {
          camera.updateProjectionMatrix()
        })
    }
  }

  initLightsDebug() {
    const {ambientLight, directionalLight} = this.#game.world

    const _params = {
      ambientColor: Config.lights.day.ambient.color,
      directionalColor: Config.lights.day.directional.color,
    }

    const folder = this.dat.addFolder('Light')

    const ambientFolder = folder.addFolder('Ambient')

    ambientFolder
      .add(ambientLight, 'intensity')
      .name('Intensity')
      .min(0)
      .max(20)
      .step(.01)

    ambientFolder
      .addColor(_params, 'ambientColor')
      .name('Color')
      .onChange(() => {
        ambientLight.color = new Color(_params.ambientColor)
      })

    const directionalFolder = folder.addFolder('Directional')

    directionalFolder
      .add(directionalLight, 'intensity')
      .name('Intensity')
      .min(0)
      .max(150)
      .step(.01)

    for (const axis of vec3Key) {
      directionalFolder
        .add(directionalLight.position, axis)
        .name(`Pos ${axis}`)
        .min(-100)
        .max(100)
        .step(.1)
    }

    directionalFolder
      .addColor(_params, 'directionalColor')
      .name('Color')
      .onChange(() => {
        directionalLight.color = new Color(_params.directionalColor)
      })
  }

  initPlotsDebug() {
    this.#game.assets.addEventListener('assetsLoaded', () => {
      const plots = this.#game.plotManager.plots

      for (const plot of plots) {
        const folder = this.dat.addFolder(`Plot ${plot.id}`)

        for (const axis of vec3Key) {
          folder
            .add(plot.object!.position, axis)
            .name(`Pos ${axis}`)
            .min(-100)
            .max(100)
            .step(.1)
        }
      }
    })
  }
}