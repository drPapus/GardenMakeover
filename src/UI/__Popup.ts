import {gsap} from 'gsap'


export class __Popup {
  private popup: HTMLDivElement
  private text: HTMLDivElement
  private popupTimeline!: gsap.core.Timeline
  private isOpen = false

/**
 * Constructor for the __Popup class.
 * Creates a new popup element and adds it to the page.
 * Initializes the animation for the popup.
 */
  constructor() {
    this.popup = document.createElement('div')
    this.popup.className = 'popup'

    const close = document.createElement('button')
    close.innerText = 'Close'
    close.className = 'popup__close'
    close.addEventListener('click', () => this.close())

    this.text = document.createElement('div')

    this.popup.append(this.text, close)

    document.body.append(this.popup)

    this.initAnimation()
  }

  initAnimation() {
    gsap.set(this.popup, {
      transform: 'translate(-50%, -50%) scale(0)',
    })

    this.popupTimeline = gsap.timeline({paused: true})

    this.popupTimeline
      .to(this.popup, {
        transform: 'translate(-50%, -50%) scale(1)',
        duration: .3,
        ease: 'power4.inOut',
      }, 0)
  }

  close() {
    if (!this.isOpen) return
    this.isOpen = false

    this.popupTimeline.timeScale(1.2).reverse()
  }

  open(text: string) {
    this.text.innerText = text

    if (this.isOpen) return
    this.isOpen = true

    this.popupTimeline.timeScale(1).play(0)
  }
}
