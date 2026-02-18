import {Game} from './Game'
import {Config} from './Config'


export class Economy {
  private game: Game
  money: number = Config.startMoney

  constructor() {
    this.game = Game.getInstance()
  }

  canAfford(cost: number) {
    return this.money >= cost
  }

  spend(cost: number) {
    if (!this.canAfford(cost)) return false

    this.money -= cost

    this.game.ui.moneyBar.setMoneyAmount(this.money)

    return true
  }

  earn(amount: number) {
    this.money += amount

    this.game.ui.moneyBar.setMoneyAmount(this.money)
  }
}