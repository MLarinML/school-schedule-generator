/**
 * Плавная прокрутка к элементу с учетом фиксированного header'а
 */
export const smoothScrollTo = (elementId: string, offset: number = 80) => {
  const element = document.getElementById(elementId)
  if (element) {
    const elementPosition = element.offsetTop - offset
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    })
  }
}

/**
 * Плавная прокрутка к элементу по href
 */
export const smoothScrollToHref = (href: string, offset: number = 80) => {
  if (href.startsWith('#')) {
    const elementId = href.substring(1)
    smoothScrollTo(elementId, offset)
  } else if (href.includes('#')) {
    const [path, hash] = href.split('#')
    if (window.location.pathname === path || path === '/') {
      smoothScrollTo(hash, offset)
    } else {
      // Если это другая страница, переходим на неё и затем прокручиваем
      window.location.href = href
    }
  }
}
