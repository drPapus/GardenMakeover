import {Game} from '../Core/Game'
import {gsap} from 'gsap'
import {Config} from '../Core/Config'


type TMode = 'day' | 'night'


export class DayNightToggle {
  #game: Game
  #tl!: gsap.core.Timeline
  switcher: HTMLButtonElement
  mode: TMode = 'day'

  constructor() {
    this.#game = Game.getInstance()

    this.initAnimation()

    this.switcher = document.createElement('button')
    this.switcher.className = 'mode-toggle mode-toggle--day'

    this.switcher.addEventListener('click', () => this.toggleMode())

    document.body.append(this.switcher)
  }

  toggleMode() {
    if (this.mode === 'day') {
      this.mode = 'night'
      this.switcher.classList.remove('mode-toggle--day')
      this.switcher.classList.add('mode-toggle--night')
      this.#tl.play()
      return
    }

    this.mode = 'day'
    this.switcher.classList.remove('mode-toggle--night')
    this.switcher.classList.add('mode-toggle--day')
    this.#tl.reverse()
  }

  initAnimation() {
    const {day, night} = Config.lights
    this.#tl = gsap.timeline({paused: true})
      .fromTo(this.#game.world.directionalLight,
        {
          intensity: day.directional.intensity,
          duration: 1,
        }, {
          intensity: night.directional.intensity,
        }, 0)
      .fromTo(this.#game.world.directionalLight.position,
        {
          x: day.directional.position.x,
          y: day.directional.position.y,
          z: day.directional.position.z,
          duration: 1,
        }, {
          x: night.directional.position.x,
          y: night.directional.position.y,
          z: night.directional.position.z,
        }, 0)
  }
}