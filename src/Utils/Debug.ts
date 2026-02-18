import {
  AxesHelper,
  Color,
  DirectionalLightHelper,
  PerspectiveCamera,
  Fog,
} from 'three'
import {GUI} from 'dat.gui'

import {Game} from '../Core/Game'
import {Config} from '../Core/Config'


const vec3Key = ['x', 'y', 'z'] as const


export class Debug {
  private game: Game
  dat: GUI

  constructor() {
    this.game = Game.getInstance()

    this.dat = new GUI()
    this.dat.domElement.parentElement!.style.zIndex = '9999'

    this.initCameraDebug()
    this.initLightsDebug()
    this.initHelpers()
    this.initPlotsDebug()
    this.initFogDebug()
  }

  initHelpers() {
    const directionalLightHelper = new DirectionalLightHelper(this.game.world.directionalLight, 5)
    this.game.world.scene.add(directionalLightHelper)

    const axesHelper = new AxesHelper(20)
    this.game.world.scene.add(axesHelper)
  }

  initCameraDebug() {
    const camera = this.game.world.camera

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
    const {hemisphereLight, directionalLight} = this.game.world

    const _params = {
      hemisphereSkyColor: Config.lights.day.hemisphere.skyColor,
      hemisphereGroundColor: Config.lights.day.hemisphere.groundColor,
      directionalColor: Config.lights.day.directional.color,
    }

    const folder = this.dat.addFolder('Light')

    const hemisphereFolder = folder.addFolder('Hemisphere')

    hemisphereFolder
      .add(hemisphereLight, 'intensity')
      .name('Intensity')
      .min(0)
      .max(20)
      .step(.01)

    hemisphereFolder
      .addColor(_params, 'hemisphereSkyColor')
      .name('Sky Color')
      .onChange(() => {
        hemisphereLight.color = new Color(_params.hemisphereSkyColor)
      })

    hemisphereFolder
      .addColor(_params, 'hemisphereGroundColor')
      .name('Ground Color')
      .onChange(() => {
        hemisphereLight.groundColor = new Color(_params.hemisphereGroundColor)
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
    this.game.assets.addEventListener('assetsLoaded', () => {
      const plots = this.game.plotManager.plots

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

  initFogDebug() {
    const fog = this.game.world.scene.fog as Fog

    const folder = this.dat.addFolder('Fog')

    const _params = {
      color: Config.fog.color,
    }

    folder
      .add(fog, 'near')
      .name(`Near`)
      .min(0)
      .max(200)
      .step(.5)

    folder
      .add(fog, 'far')
      .name(`Far`)
      .min(0)
      .max(200)
      .step(.5)

    folder
      .addColor(_params, 'color')
      .name('Color')
      .onChange(() => {
        fog.color = new Color(_params.color)
      })
  }
}