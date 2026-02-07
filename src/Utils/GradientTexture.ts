import {CanvasTexture} from 'three'


export const makeVerticalGradientTexture = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 10

  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 1)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const tex = new CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}