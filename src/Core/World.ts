import {
  ACESFilmicToneMapping,
  AmbientLight,
  DirectionalLight, Fog,
  HemisphereLight,
  MathUtils, PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three'
import {gsap} from 'gsap'

import {Game} from './Game'
import {Config} from './Config'


export class World {
  private game: Game
  private canvas: HTMLCanvasElement

  private cameraSavedPosition: Vector3 | null = null
  private tmpCameraRightDirection: Vector3 = new Vector3()
  private tmpCameraForwardDirection: Vector3 = new Vector3()
  private tmpCameraMove: Vector3 = new Vector3()

  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  hemisphereLight: HemisphereLight
  directionalLight: DirectionalLight


  constructor() {
    this.game = Game.getInstance()
    this.canvas = this.game.threeCanvas

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

    // Hemisphere Light
    const {skyColor, groundColor, intensity: hemisphereIntensity} = Config.lights.day.hemisphere
    this.hemisphereLight = new HemisphereLight(
      skyColor,
      groundColor,
      hemisphereIntensity,
    )
    this.scene.add(this.hemisphereLight)

    // Directional Light
    const {
      color: directionalColor,
      intensity: directionalIntensity,
      position: directionalPosition,
    } = Config.lights.day.directional
    this.directionalLight = new DirectionalLight(directionalColor, directionalIntensity)
    this.directionalLight.position.copy(directionalPosition)
    this.directionalLight.castShadow = true
    this.directionalLight.shadow.mapSize.set(1024, 1024)
    this.directionalLight.shadow.camera.left = -25
    this.directionalLight.shadow.camera.right = 25
    this.directionalLight.shadow.camera.top = 25
    this.directionalLight.shadow.camera.bottom = -25
    this.directionalLight.shadow.camera.near = 1
    this.directionalLight.shadow.camera.far = 200
    this.directionalLight.shadow.bias = -.0005
    this.directionalLight.shadow.normalBias = .0007
    this.directionalLight.shadow.camera.updateProjectionMatrix()
    this.scene.add(this.directionalLight)

    // Renderer
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      depth: true,
    })
    this.renderer.shadowMap.enabled = true
    // this.renderer.shadowMap.type = PCFSoftShadowMap
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.25
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

    const {color: fogColor, near: fogNear, far: fogFar} = Config.fog
    this.scene.fog = new Fog(fogColor, fogNear, fogFar)
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  resize() {
    const {clientWidth, clientHeight} = this.game.canvasContainer

    this.camera.aspect = clientWidth / clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(clientWidth, clientHeight)
  }

  panBy(pointerDeltaX: number, pointerDeltaY: number) {
    const getPanAxes = () => {
      this.tmpCameraRightDirection.setFromMatrixColumn(this.camera.matrixWorld, 0)
      this.tmpCameraRightDirection.y = 0
      this.tmpCameraRightDirection.normalize()

      this.camera.getWorldDirection(this.tmpCameraForwardDirection)
      this.tmpCameraForwardDirection.y = 0
      this.tmpCameraForwardDirection.normalize()
    }

    const {minX, minZ, maxX, maxZ, speed} = Config.camera.move

    getPanAxes()

    this.tmpCameraMove.set(0, 0, 0)
    this.tmpCameraMove.addScaledVector(this.tmpCameraRightDirection, -pointerDeltaX * speed)
    this.tmpCameraMove.addScaledVector(this.tmpCameraForwardDirection, pointerDeltaY * speed)

    this.camera.position.add(this.tmpCameraMove)

    this.camera.position.x = MathUtils.clamp(this.camera.position.x, minX, maxX)
    this.camera.position.z = MathUtils.clamp(this.camera.position.z, minZ, maxZ)
  }

  focusCameraOnPoint(targetPoint: Vector3) {
    if (!this.cameraSavedPosition) {
      this.cameraSavedPosition = this.camera.position.clone()
    }

    const nextCameraPosition = new Vector3(
      targetPoint.x + 10.5,
      Config.camera.position.y * .7,
      targetPoint.z,
    )

    gsap.to(this.camera.position, {
      x: nextCameraPosition.x,
      y: nextCameraPosition.y,
      z: nextCameraPosition.z,
      duration: 0.35,
      ease: 'power2.out',
    })
  }

  restoreCamera() {
    if (!this.cameraSavedPosition) return

    const savedPosition = this.cameraSavedPosition.clone()

    gsap.to(this.camera.position, {
      x: savedPosition.x,
      y: savedPosition.y,
      z: savedPosition.z,
      duration: 0.35,
      ease: 'power2.out',
      onComplete: () => {
        this.cameraSavedPosition = null
      },
    })
  }
}