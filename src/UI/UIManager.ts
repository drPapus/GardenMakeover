import {PlotBar} from './PlotBar'
import {DayNightSwitcher} from './DayNightSwitcher'
import {MoneyBar} from './MoneyBar'
import {Popup} from './Popup'


export class UIManager {
  plotBar: PlotBar
  dayNightSwitcher: DayNightSwitcher
  moneyBar: MoneyBar
  popup: Popup

  constructor() {
    this.plotBar = new PlotBar()
    this.dayNightSwitcher = new DayNightSwitcher()
    this.moneyBar = new MoneyBar()
    this.popup = new Popup()
  }
}