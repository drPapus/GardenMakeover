import {
  BoxGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Scene,
  Vector3,
  EventDispatcher,
} from 'three'
import {clone as SceletonClone} from 'three/examples/jsm/utils/SkeletonUtils.js'
import {gsap} from 'gsap'

import {Game} from '../Core/Game'
import {fitObjectIntoBox} from '../Utils/FitObjectIntoBox'
import {Config} from '../Core/Config'
import {makeVerticalGradientTexture} from '../Utils/GradientTexture'
import {getCareActionByEntity} from '../Utils/CareActionByEntity'


export type TPlotID = typeof Config['plots'][number]['id']
export type TCropBed = 'corn' | 'tomato' | 'strawberry' | 'grape'
export type TAnimals = 'chicken' | 'sheep' | 'cow'
export type TFarmEntity = TCropBed | TAnimals
export type TGrowthStage = typeof Config.growth.stages[number]
export type TGrowthState = 'empty' | 'growingFirstHalf' | 'needsCare' | 'growingSecondHalf' | 'ripe'
export type TCareAction = 'water' | 'feed'
export type TPlotEvents = {
  needsCare: { type: 'needsCare', action: TCareAction }
  careDone: {type: 'careDone'}
  ripe: { type: 'ripe' }
  stageChanged: { type: 'stageChanged' }
}

const plotSize = {
  width: 6,
  depth: 10,
}

const growingFirstHalfMultiplier = .7

const cropBedPositions = [
  new Vector3(-2, 0, -3), new Vector3(-2, 0, 0), new Vector3(-2, 0, 3),
  new Vector3(2, 0, -3), new Vector3(2, 0, 0), new Vector3(2, 0, 3),
]

const animalPositions = [
  new Vector3(-1, 0, 1.5), new Vector3(-1, 0, -2.5),
  new Vector3(1, 0, 1.5), new Vector3(1, 0, -2.5),
]


export class Plot extends EventDispatcher<TPlotEvents> {
  private game: Game
  private scene: Scene

  readonly object: Group
  private selector!: Mesh
  private hitBox!: Mesh
  readonly position: Vector3 = new Vector3()

  private isSelected: boolean = false
  readonly id: TPlotID
  readonly worldPosition: Vector3 = new Vector3()

  private growthState: TGrowthState = 'empty'
  private visualStage: TGrowthStage = 'soil'
  private totalGrowDurationSeconds: number = 0
  private elapsedGrowSeconds: number = 0
  private isCareRequired: boolean = false
  private careDone: boolean = false

  private entityType: TFarmEntity | null = null
  private isRipe: boolean = false

  constructor(id: TPlotID, position: Vector3) {
    super()

    this.game = Game.getInstance()
    this.scene = this.game.world.scene

    this.id = id
    this.position.copy(position)

    this.object = new Group()
    this.object.position.copy(position)
    this.scene.add(this.object)

    this.initHitBox()
    this.initSelector()

    this.setFarmEntity(null, 'ripe', true)
  }

  get isSelectable() {
    return this.entityType === null ? true : this.isRipe
  }

  get needsCare() {
    return this.isCareRequired
  }

  get isAlreadyRipe() {
    return this.isRipe
  }

  get growthProgress() {
    if (this.growthState === 'growingFirstHalf') return gsap.utils.mapRange(
      0, this.totalGrowDurationSeconds * growingFirstHalfMultiplier,
      0, 1,
      this.elapsedGrowSeconds,
    )

    if (this.growthState === 'growingSecondHalf') return gsap.utils.mapRange(
      this.totalGrowDurationSeconds * growingFirstHalfMultiplier, this.totalGrowDurationSeconds,
      0, 1,
      this.elapsedGrowSeconds,
    )

    return 0
  }

  get type() {
    return this.entityType
  }

  setSelected(val: boolean) {
    this.isSelected = val
    this.selector.visible = val
  }

  private initHitBox() {
    const geometry = new BoxGeometry(plotSize.width, 2, plotSize.depth)
    const material = new MeshBasicMaterial({color: '#e10000'})
    const mesh = new Mesh(geometry, material)
    mesh.name = 'hitbox'

    this.hitBox = mesh
    this.hitBox.userData.plotId = this.id
    this.hitBox.layers.set(1)

    this.game.raycaster.intersectObjects.push(this.hitBox)

    this.object.add(mesh)
  }

  private initSelector() {
    const gradientTexture = makeVerticalGradientTexture()

    const geometry = new BoxGeometry(6, 2, 10)

    const sideMaterial = new MeshBasicMaterial({
      color: '#6ef129',
      alphaMap: gradientTexture,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    })
    const hiddenMaterial = new MeshBasicMaterial({visible: false})

    const mesh = new Mesh(geometry, [sideMaterial, sideMaterial, hiddenMaterial, hiddenMaterial, sideMaterial, sideMaterial])
    mesh.name = 'selector'
    mesh.position.y += 1
    mesh.visible = false

    this.selector = mesh
    this.object.add(mesh)
  }

  applyCare() {
    if (this.growthState !== 'needsCare') return

    this.careDone = true
    this.isCareRequired = false
    this.growthState = 'growingSecondHalf'

    this.dispatchEvent({type: 'careDone'})
  }

  setFarmEntity(type: TFarmEntity | null, stage: TGrowthStage, firstAdd: boolean = true) {
    const cropBedTypes: TCropBed[] = ['corn', 'grape', 'strawberry', 'tomato']
    const animalTypes: TAnimals[] = ['chicken', 'cow', 'sheep']

    this.entityType = type
    this.resetPlot()

    if (type !== null && stage === 'ripe') this.dispatchEvent({type: 'ripe'})

    if (firstAdd) {
      this.isRipe = false
      this.elapsedGrowSeconds = 0
      this.totalGrowDurationSeconds = type === null ? 0 : Config.growth.durations[type]
      this.visualStage = 'soil'
      this.growthState = 'growingFirstHalf'
      this.careDone = false
      this.isCareRequired = false
    }

    if (type === null) {
      this.makePlaceholder()
    } else if ((cropBedTypes as string[]).includes(type)) {
      this.makeCropBed(type as TCropBed, stage)
    } else if ((animalTypes as string[]).includes(type)) {
      this.makeAnimals(type as TAnimals, stage)
    }

    this.dispatchEvent({type: 'stageChanged'})
  }

  update(deltaSeconds: number) {
    this.updateWorldPosition()

    if (!this.entityType) return
    if (this.growthState === 'empty' || this.growthState === 'ripe') return
    if (this.growthState === 'needsCare') return

    this.elapsedGrowSeconds += deltaSeconds

    const halfTime = this.totalGrowDurationSeconds * growingFirstHalfMultiplier

    if (this.growthState === 'growingFirstHalf') {
      if (this.elapsedGrowSeconds >= halfTime) {
        this.elapsedGrowSeconds = halfTime
        this.setStageByProgress(growingFirstHalfMultiplier)

        this.growthState = 'needsCare'
        this.isCareRequired = true

        const action = getCareActionByEntity(this.entityType)
        this.dispatchEvent({type: 'needsCare', action})
        return
      }

      const p = this.elapsedGrowSeconds / this.totalGrowDurationSeconds
      this.setStageByProgress(p)
      return
    }

    if (this.growthState === 'growingSecondHalf') {
      if (this.elapsedGrowSeconds >= this.totalGrowDurationSeconds) {
        this.elapsedGrowSeconds = this.totalGrowDurationSeconds
        this.growthState = 'ripe'
        this.setStageByProgress(1)

        this.dispatchEvent({type: 'ripe'})
        return
      }

      const p = this.elapsedGrowSeconds / this.totalGrowDurationSeconds
      this.setStageByProgress(p)
    }
  }

  private setStageByProgress(progress01: number) {
    const p = Math.max(0, Math.min(1, progress01))

    let nextStage: TGrowthStage = 'soil'

    if (p >= 1) {
      nextStage = 'ripe'
    } else if (p >= growingFirstHalfMultiplier) {
      nextStage = 'medium'
    } else {
      const t = p * growingFirstHalfMultiplier

      if (t < 1 / 3) nextStage = 'soil'
      else if (t < 2 / 3) nextStage = 'small'
      else nextStage = 'medium'
    }

    if (nextStage === this.visualStage) return
    this.visualStage = nextStage

    this.setFarmEntity(this.entityType, this.visualStage, false)
  }

  private updateWorldPosition() {
    this.object.getWorldPosition(this.worldPosition)
  }

  getWorldPosition(out: Vector3) {
    return out.copy(this.worldPosition)
  }

  getWorldPositionWithOffset(out: Vector3, offset: Vector3) {
    return out.copy(this.worldPosition).add(offset)
  }

  private makePlaceholder() {
    this.isRipe = false

    const placeholder = (this.game.assets.models.placeholder as Mesh).clone()

    placeholder.receiveShadow = true

    fitObjectIntoBox(placeholder, {width: 6, depth: 10})

    this.object.add(placeholder)
  }

  private makeCropBed(type: TCropBed, stage: TGrowthStage) {
    this.isRipe = stage === 'ripe'

    switch (stage) {
      case 'soil': {
        const ground = (this.game.assets.models.ground as Mesh).clone()
        ground.receiveShadow = true
        fitObjectIntoBox(ground, {width: 6, depth: 10})
        this.object.add(ground)
        break
      }
      case 'small':
      case 'medium':
      case 'ripe': {
        const growthStageIndex = Config.growth.stages.indexOf(stage)
        const source = this.game.assets.models[`${type}_${growthStageIndex}`] as Mesh

        for (const position of cropBedPositions) {
          const obj = source.clone()
          obj.position.copy(position)
          this.object.add(obj)
        }
      }
    }
  }

  private makeAnimals(type: TAnimals, stage: TGrowthStage) {
    this.isRipe = stage === 'ripe'

    const scales: Record<TGrowthStage, number> = {
      soil: .2,
      small: .4,
      medium: .6,
      ripe: 1,
    }

    const fence = (this.game.assets.models.fence as Mesh).clone()

    fitObjectIntoBox(fence, {width: 6, depth: 10})

    this.object.add(fence)

    const source = this.game.assets.models[`${type}_1`] as Object3D

    for (const position of animalPositions) {
      const obj = SceletonClone(source)

      obj.position.copy(position)
      const scale = scales[stage]
      obj.scale.set(scale, scale, scale)

      this.object.add(obj)
    }

  }

  private resetPlot() {
    const toRemove = this.object.children.filter(child => !['hitbox', 'selector'].includes(child.name))

    for (const child of toRemove) {
      this.object.remove(child)
    }
  }

}