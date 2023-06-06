import { Fade, Stack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { FaqsView } from '../src/components/FaqsView'
import { FooterView } from '../src/components/FooterView'
import { NavbarView } from '../src/components/NavbarView'
import { PricingCollabView } from '../src/components/PricingCollabView'
import { PricingHeroView } from '../src/components/PricingHeroView'
import { TokenView } from '../src/components/TokenView'

export const PricingPage = () => {
  const [fadeIn, setFadeIn] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      setFadeIn(true)
    }, 400)
  }, [])

  return (
    <Fade in={fadeIn}>
      <Stack
        width="100vw"
        height="full"
        bg="black"
        alignItems="center"
        spacing={0}
        animation={'fade-in 0.5s ease-in-out'}
      >
        <NavbarView gradient="linear(to-r, #181818, #222222)" />
        <Stack width="full" height="full" bg="black.500" alignItems="center" spacing={0}>
          <PricingHeroView />
          <PricingCollabView />
          <TokenView />
          <FaqsView />
        </Stack>
        <FooterView />
      </Stack>
    </Fade>
  )
}

export default PricingPage
