import './Styles/Styles.scss'
import {Game} from './Core/Game'


window.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector<HTMLDivElement>('.canvas-container')

  if (!container) throw new Error('Container not found')

  const game = Game.getInstance(container)
  await game.init()
})
