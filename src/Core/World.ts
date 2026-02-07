import {
  AmbientLight,
  DirectionalLight,
  PerspectiveCamera,
  ReinhardToneMapping,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'

import {Game} from './Game'
import {Config} from './Config'


export class World {
  #game: Game

  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  ambientLight: AmbientLight
  directionalLight: DirectionalLight

  constructor() {
    this.#game = Game.getInstance()

    // Scene
    this.scene = new Scene()

    // Camera
    const {fov, far, lookAt, near, position} = Config.camera
    this.camera = new PerspectiveCamera()
    this.camera.fov = fov
    this.camera.near = near
    this.camera.far = far
    this.camera.position.copy(position)
    this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z)
    this.scene.add(this.camera)

    // Ambient Light
    const {color: ambientColor, intensity: ambientIntensity} = Config.lights.ambient
    this.ambientLight = new AmbientLight(ambientColor, ambientIntensity)
    this.scene.add(this.ambientLight)

    // Directional Light
    const {
      color: directionalColor,
      intensity: directionalIntensity,
      position: directionalPosition,
    } = Config.lights.directional
    this.directionalLight = new DirectionalLight(directionalColor, directionalIntensity)
    this.directionalLight.position.copy(directionalPosition)
    this.directionalLight.castShadow = true
    this.directionalLight.shadow.mapSize.set(512, 512)
    this.directionalLight.shadow.camera.left = -50
    this.directionalLight.shadow.camera.right = 50
    this.directionalLight.shadow.camera.top = 50
    this.directionalLight.shadow.camera.bottom = -50
    this.directionalLight.shadow.camera.near = 1
    this.directionalLight.shadow.camera.far = 200
    this.directionalLight.shadow.bias = -.0001
    this.directionalLight.shadow.normalBias = .0007
    this.directionalLight.shadow.camera.updateProjectionMatrix()
    this.scene.add(this.directionalLight)

    // Renderer
    const canvas = this.#game.canvasContainer.querySelector('canvas')

    if (!canvas) throw new Error('Canvas not found')

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
    })
    this.renderer.shadowMap.enabled = true
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = ReinhardToneMapping
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.#game.updatables['world'] = () => this.update()
  }

  update() {
    this.renderer.render(this.scene, this.camera)
  }

  resize() {
    const {clientWidth, clientHeight} = this.#game.canvasContainer

    this.camera.aspect = clientWidth / clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(clientWidth, clientHeight)
  }
}