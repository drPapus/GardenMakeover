import {
  AdditiveBlending,
  Box3,
  BoxGeometry, CapsuleGeometry, CylinderGeometry,
  DoubleSide,
  Group, MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial, NormalBlending,
  Object3D,
  Scene,
  Vector3,
} from 'three'
import {clone as SceletonClone} from 'three/examples/jsm/utils/SkeletonUtils.js'
import {gsap} from 'gsap'

import {Game} from '../Core/Game'
import {fitObjectIntoBox} from '../Utils/FitObjectIntoBox'
import {Config} from '../Core/Config'
import {makeVerticalGradientTexture} from '../Utils/GradientTexture'


export type TCropBed = 'corn' | 'tomato' | 'strawberry' | 'grape'
export type TAnimals = 'chicken' | 'sheep' | 'cow'
export type TFarmEntity = TCropBed | TAnimals
export type TGrowthStage = typeof Config.growth.stages[number]


export class Plot {
  #game: Game
  #scene: Scene
  #isSelected: boolean = false
  object: Group
  #selector!: Mesh
  #hitBox!: Mesh
  #growthIndicator!: Mesh
  id: number = 0

  #farmEntityType: TFarmEntity | null = null
  #growthStageIndex: number = 0
  #timeInStage: number = 0
  #timeInToRipe: number = 0
  #timeToRipe: number = 0
  #isRipe: boolean = false

  constructor(id: number, position: Vector3) {
    this.#game = Game.getInstance()
    this.#scene = this.#game.world.scene

    this.id = id

    this.object = new Group()
    this.object.position.copy(position)
    this.#scene.add(this.object)

    this.#initHitBox()
    this.#initSelector()
    this.#initGrowthIndicator()

    this.setFarmEntity(null, 'ripe', true)
  }

  get isSelectable() {
    return this.#farmEntityType === null ? true : this.#isRipe
  }

  get isRipe() {
    return this.#isRipe
  }

  get type() {
    return this.#farmEntityType
  }

  set isSelected(val: boolean) {
    if (val) {
      this.#selector.visible = true
    } else {
      if (val !== this.#isSelected) this.#selector.visible = false
    }

    this.#isSelected = val
  }

  #initHitBox() {
    const geom = new BoxGeometry(6, 2, 10)
    const mat = new MeshBasicMaterial({color: '#e10000'})
    const mesh = new Mesh(geom, mat)
    mesh.name = 'hitbox'

    this.#hitBox = mesh
    this.#hitBox.userData.plotId = this.id
    this.#hitBox.layers.set(1)

    this.#game.raycaster.intersectObjects.push(this.#hitBox)

    this.object.add(mesh)
  }

  #initSelector() {
    const gradientTexture = makeVerticalGradientTexture()

    const geom = new BoxGeometry(6, 2, 10)

    const sideMat = new MeshBasicMaterial({
      color: '#43961a',
      alphaMap: gradientTexture,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    })
    const hiddenMat = new MeshBasicMaterial({visible: false})

    const mesh = new Mesh(geom, [sideMat, sideMat, hiddenMat, hiddenMat, sideMat, sideMat])
    mesh.name = 'selector'
    mesh.position.y += 1
    mesh.visible = false

    this.#selector = mesh
    this.object.add(mesh)
  }

  setFarmEntity(type: TFarmEntity | null, stage: TGrowthStage, firstAdd: boolean = true) {
    const cropBedTypes: TCropBed[] = ['corn', 'grape', 'strawberry', 'tomato']
    const animalTypes: TAnimals[] = ['chicken', 'cow', 'sheep']

    this.#farmEntityType = type
    this.#resetPlot()

    this.#growthIndicator.visible = stage !== 'ripe'

    if (firstAdd) {
      this.#growthStageIndex = 0
      this.#timeInStage = 0
      this.#timeInToRipe = 0
      this.#isRipe = false
      this.#timeToRipe = type === null ? 0 : Config.growth.durations[this.#farmEntityType!].reduce((acc, cur) => acc + cur, 0)
    }

    if (type === null) {
      this.#makePlaceholder()
    } else if ((cropBedTypes as string[]).includes(type)) {
      this.#makeCropBed(type as TCropBed, stage)
    } else if ((animalTypes as string[]).includes(type)) {
      this.#makeAnimals(type as TAnimals, stage)
    }
  }

  update(delta: number) {
    if (this.#farmEntityType === null) return

    const stages = Config.growth.stages
    const durations = Config.growth.durations[this.#farmEntityType]

    // already ripe
    if (this.#isRipe) return

    this.#timeInToRipe += delta
    this.#timeInStage += delta

    this.#updateGrowthIndicator()

    const duration = durations[this.#growthStageIndex]

    if (this.#timeInStage < duration) return

    this.#growthStageIndex++
    this.#timeInStage = 0

    this.setFarmEntity(this.#farmEntityType, Config.growth.stages[this.#growthStageIndex], false)
  }

  #updateGrowthIndicator() {
    const progress = gsap.utils.mapRange(0.001, 1, 0.001, .9, this.#timeInToRipe / this.#timeToRipe)

    this.#growthIndicator.children[0].scale.y = progress
    this.#growthIndicator.children[0].position.y = -1.35 + 1.5 * progress
  }

  #initGrowthIndicator() {
    const geom = new CylinderGeometry(1, 1, 3, 14, 1)
    const trackMat = new MeshBasicMaterial({
      color: '#000',
      transparent: true,
      opacity: .1,
      depthWrite: false,
    })
    const fillMat = new MeshBasicMaterial({
      color: '#40ff02',
      depthWrite: false,
      blending: NormalBlending
    })
    fillMat.color.multiplyScalar(5)

    const track = new Mesh(geom, trackMat)
    const fill = new Mesh(geom, fillMat)
    fill.scale.set(.9, 0.001, .9)

    track.name = 'growthIndicator'
    track.rotateX(Math.PI * 1.5)
    track.add(fill)

    track.position.y = 5

    this.#growthIndicator = track
    this.object.add(track)
  }

  #makePlaceholder() {
    this.#isRipe = false

    const placeholder = (this.#game.assets.models.placeholder as Mesh).clone()

    placeholder.receiveShadow = true

    fitObjectIntoBox(placeholder, {width: 6, depth: 10})

    this.object.add(placeholder)
  }

  #makeCropBed(type: TCropBed, stage: TGrowthStage) {
    const positions = [
      new Vector3(-2, 0, -3), new Vector3(-2, 0, 0), new Vector3(-2, 0, 3),
      new Vector3(2, 0, -3), new Vector3(2, 0, 0), new Vector3(2, 0, 3),
    ]

    this.#isRipe = stage === 'ripe'

    switch (stage) {
      case 'soil': {
        const ground = (this.#game.assets.models.ground as Mesh).clone()
        ground.receiveShadow = true
        fitObjectIntoBox(ground, {width: 6, depth: 10})
        this.object.add(ground)
        break
      }
      case 'small':
      case 'medium':
      case 'ripe': {
        const source = this.#game.assets.models[`${type}_${this.#growthStageIndex}`] as Mesh

        for (const position of positions) {
          const obj = source.clone()
          obj.position.copy(position)
          this.object.add(obj)
        }
      }
    }
  }

  #makeAnimals(type: TAnimals, stage: TGrowthStage) {
    const positions = [
      new Vector3(-1, 0, 1.5), new Vector3(-1, 0, -2.5),
      new Vector3(1, 0, 1.5), new Vector3(1, 0, -2.5),
    ]

    this.#isRipe = stage === 'ripe'

    const scales: Record<TGrowthStage, number> = {
      soil: .2,
      small: .4,
      medium: .6,
      ripe: 1,
    }

    const fence = (this.#game.assets.models.fence as Mesh).clone()

    fitObjectIntoBox(fence, {width: 6, depth: 10})

    this.object.add(fence)

    const source = this.#game.assets.models[`${type}_1`] as Object3D

    for (const position of positions) {
      const obj = SceletonClone(source)

      obj.position.copy(position)
      const scale = scales[stage]
      obj.scale.set(scale, scale, scale)

      this.object.add(obj)
    }

  }

  #resetPlot() {
    const toRemove = this.object.children.filter(child => !['hitbox', 'selector', 'growthIndicator'].includes(child.name))

    for (const child of toRemove) {
      child.traverse(obj => {
        if (obj instanceof Mesh) {
          obj.geometry?.dispose()

          const mat = (obj as Mesh).material

          if (Array.isArray(mat)) {
            for (const m of mat) m.dispose()
          } else {
            mat.dispose()
          }
        }
      })

      this.object.remove(child)
    }
  }

}