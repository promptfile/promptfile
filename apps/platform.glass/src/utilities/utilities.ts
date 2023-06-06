export function isValidEmail(email: string): boolean {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)
}

export function scrollToView(elementId: string) {
  const scrollToView = document.getElementById(elementId)
  const navbarView = document.getElementById('NavbarView')
  if (scrollToView && navbarView) {
    window.scrollTo({
      top: scrollToView.offsetTop - navbarView.offsetHeight,
      behavior: 'smooth',
    })
  }
}

export function openUrl(url: string, newTab: boolean = false) {
  if (newTab) {
    const openedWindow = window.open(url, '_blank')
    if (openedWindow) {
      openedWindow.focus()
    }
  } else {
    window.location.href = url
  }
}
