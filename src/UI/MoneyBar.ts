import {Game} from '../Core/Game'


export class MoneyBar {
  #game: Game
  #bar: HTMLDivElement

  constructor() {
    this.#game = Game.getInstance()

    this.#bar = document.createElement('div')
    this.#bar.className = 'money-bar'

    this.setMoneyAmount(this.#game.economy.money)

    document.getElementById('app')?.append(this.#bar)
  }

  setMoneyAmount(val: number) {
    this.#bar.innerText = `${val}`
  }
}