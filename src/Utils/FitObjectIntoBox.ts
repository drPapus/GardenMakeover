import {Object3D, Box3, Vector3} from 'three'


export const fitObjectIntoBox = (
  object: Object3D,
  fitBox: {
    width: number
    depth: number
  },
  options?: {
    center?: boolean
    ground?: boolean
  },
) => {
  const box = new Box3().setFromObject(object)

  if (box.isEmpty()) return

  const size = box.getSize(new Vector3())
  const center = box.getCenter(new Vector3())

  const scaleX = fitBox.width / size.x
  const scaleZ = fitBox.depth / size.z

  const scale = Math.min(scaleX, scaleZ)

  object.scale.multiplyScalar(scale)

  box.setFromObject(object)
  box.getCenter(center)

  if (options?.center !== false) {
    object.position.x -= center.x
    object.position.z -= center.z
  }

  if (options?.ground !== false) {
    object.position.y -= box.min.y
  }
}
