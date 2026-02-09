import {gsap} from 'gsap'

import {PlotBar} from './PlotBar'
import {DayNightToggle} from './DayNightToggle'
import {MoneyBar} from './MoneyBar'
import {Popup} from './Popup'
import {Game} from '../Core/Game'
import {Tutorial} from './Tutorial'


export class UIManager {
  #game: Game

  plotBar: PlotBar
  dayNightToggle: DayNightToggle
  moneyBar: MoneyBar
  popup: Popup
  tutorial: Tutorial

  constructor() {
    this.#game = Game.getInstance()

    this.plotBar = new PlotBar()
    this.dayNightToggle = new DayNightToggle()
    this.moneyBar = new MoneyBar()
    this.popup = new Popup()
    this.tutorial = new Tutorial()


    this.#game.assets.addEventListener('assetsLoaded', () => {
      this.hidePreloader()
    })
  }

  hidePreloader() {
    const preloader = document.querySelector<HTMLDivElement>('.preloader')

    gsap.to(preloader, {
      opacity: 0,
      duration: .6,
      onComplete: () => {
        preloader!.style.display = 'none'
      },
    })
  }
}