import {gsap} from 'gsap'


export class Popup {
  #popup: HTMLDivElement
  #text: HTMLDivElement
  tl!: gsap.core.Timeline
  isOpen: boolean = false

  constructor() {
    this.#popup = document.createElement('div')
    this.#popup.className = 'popup'

    const close = document.createElement('button')
    close.innerText = 'Close'
    close.className = 'popup__close'
    close.addEventListener('click', () => this.close())

    this.#text = document.createElement('div')

    this.#popup.append(this.#text, close)

    document.body.append(this.#popup)

    this.initAnimation()
  }

  initAnimation() {
    gsap.set(this.#popup, {
      transform: 'translate(-50%, -50%) scale(0)',
    })

    this.tl = gsap.timeline({paused: true})

    this.tl
      .to(this.#popup, {
        transform: 'translate(-50%, -50%) scale(1)',
        duration: .3,
        ease: 'power4.inOut',
      }, 0)
  }

  close() {
    if (!this.isOpen) return
    this.isOpen = false

    this.tl.timeScale(1.2).reverse()
  }

  open(text: string) {
    this.#text.innerText = text

    if (this.isOpen) return
    this.isOpen = true

    this.tl.timeScale(1).play(0)
  }
}