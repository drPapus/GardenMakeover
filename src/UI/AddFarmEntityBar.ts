import {Config} from '../Core/Config'


export class AddFarmEntityBar {
  constructor() {
    const barContainer = document.createElement('div')
    barContainer.className = 'add-bar isOpen'

    const header = document.createElement('div')
    header.className = 'add-bar__header'

    const title = document.createElement('div')
    title.className = 'add-bar__title'
    title.textContent = 'Choose what to place'

    const closeBtn = document.createElement('button')
    closeBtn.className = 'add-bar__close'
    closeBtn.textContent = 'Close'
    closeBtn.addEventListener('click', () => {
    })

    header.append(title, closeBtn)

    const list = document.createElement('div')
    list.className = 'add-bar__list'

    list.innerHTML = Config.farmEntities.map(({type, name, price}) =>
      `<button class="add-bar__farm-card" data-entity-type="${type}">` +
      `<div class="add-bar__preview"><img src="/assets/images/farm-entities/${type}.png" class="add-bar__preview" alt="${name}"/></div>` +
      `<div class="add-bar__meta">` +
      `<span class="add-bar__name">${name}</span>` +
      `<span class="add-bar__price">${price}</span>` +
      `</div>` +
      `</button>`,
    ).join('')


    barContainer.append(header, list)

    document.getElementById('app')?.append(barContainer)
  }
}