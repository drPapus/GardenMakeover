import {
  AmbientLight,
  DirectionalLight, MathUtils,
  PerspectiveCamera,
  ReinhardToneMapping,
  Scene,
  SRGBColorSpace, Vector2, Vector3,
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
    const {color: ambientColor, intensity: ambientIntensity} = Config.lights.day.ambient
    this.ambientLight = new AmbientLight(ambientColor, ambientIntensity)
    this.scene.add(this.ambientLight)

    // Directional Light
    const {
      color: directionalColor,
      intensity: directionalIntensity,
      position: directionalPosition,
    } = Config.lights.day.directional
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
    this.initCameraMove()
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

  initCameraMove() {
    const canvas = this.#game.canvas

    let dragging = false
    const last = new Vector2()

    const right = new Vector3()
    const forward = new Vector3()
    const move = new Vector3()

    const getPanAxes = () => {
      right.setFromMatrixColumn(this.camera.matrixWorld, 0)
      right.y = 0
      right.normalize()

      this.camera.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()
    }

    const endDrag = () => {
      dragging = false
    }

    canvas.addEventListener('pointerdown', e => {
      dragging = true
      last.set(e.clientX, e.clientY)
      canvas.setPointerCapture(e.pointerId)
    })

    canvas.addEventListener('pointerup', endDrag)
    canvas.addEventListener('pointercancel', endDrag)
    canvas.addEventListener('lostpointercapture', endDrag)

    canvas.addEventListener('pointermove', e => {
      if (!dragging) return

      const dx = e.clientX - last.x
      const dy = e.clientY - last.y
      last.set(e.clientX, e.clientY)

      const {minX, maxX, minZ, maxZ, speed} = Config.camera.move

      getPanAxes()

      move.set(0, 0, 0)
      move.addScaledVector(right, -dx * speed)
      move.addScaledVector(forward, dy * speed)

      this.camera.position.add(move)

      this.camera.position.x = MathUtils.clamp(this.camera.position.x, minX, maxX)
      this.camera.position.z = MathUtils.clamp(this.camera.position.z, minZ, maxZ)
    })
  }

}