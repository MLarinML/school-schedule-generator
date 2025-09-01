/**
 * Плавная прокрутка к элементу с учетом фиксированного header'а
 */
export const smoothScrollTo = (elementId: string, offset: number = 80) => {
  try {
    const element = document.getElementById(elementId)
    if (element) {
      const elementPosition = element.offsetTop - offset
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      })
      return true
    } else {
      console.warn(`Element with id '${elementId}' not found`)
      return false
    }
  } catch (error) {
    console.warn('Error scrolling to element:', error)
    return false
  }
}

/**
 * Плавная прокрутка к элементу по href
 */
export const smoothScrollToHref = (href: string, offset: number = 80) => {
  try {
    if (href.startsWith('#')) {
      // Если ссылка только с хешем, проверяем, находимся ли мы на главной странице
      if (window.location.pathname === '/') {
        smoothScrollTo(href.substring(1), offset)
      } else {
        // Если не на главной, переходим на главную с хешем
        window.location.href = `/${href}`
      }
    } else if (href.includes('#')) {
      const [path, hash] = href.split('#')
      if (window.location.pathname === path || path === '/') {
        // Если мы на той же странице или на главной
        if (window.location.pathname === '/') {
          smoothScrollTo(hash, offset)
        } else {
          // Если не на главной, переходим на главную с хешем
          window.location.href = `/${href}`
        }
      } else {
        // Если это другая страница, переходим на неё и затем прокручиваем
        window.location.href = href
      }
    }
  } catch (error) {
    console.warn('Error in smoothScrollToHref:', error)
    // Fallback: просто переходим по ссылке
    window.location.href = href
  }
}
