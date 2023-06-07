import { Fade, Flex, Stack, useColorMode } from '@chakra-ui/react'
import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { BuildView } from '../src/components/BuildView'
import { CommitView } from '../src/components/CommitView'
import { DemonView } from '../src/components/DemonView'
import { FooterView } from '../src/components/FooterView'
import { HeroView } from '../src/components/HeroView'
import { NavbarView } from '../src/components/NavbarView'
import { PricingCollabView } from '../src/components/PricingCollabView'

const Home: NextPage = () => {
  const [fadeIn, setFadeIn] = useState(false)
  const { setColorMode } = useColorMode()

  useEffect(() => {
    setColorMode('dark')
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
        overflow={'hidden'}
      >
        <Flex
          position="absolute"
          top={['128px', '156px', '0px']}
          maxWidth="full"
          justifyContent="center"
          overflow="hidden"
        >
          <DemonView />
        </Flex>
        <Stack zIndex={2} width="full" height="full" alignItems="center" spacing={0}>
          <NavbarView />
          <HeroView />
        </Stack>
        <Stack alignItems="center" width="full" spacing="0" bgGradient={'linear(to-r, #181818, #222222)'}>
          <CommitView />
          {/* <DetailsView /> */}
          <PricingCollabView />
          <BuildView />
        </Stack>
        <FooterView />
      </Stack>
    </Fade>
  )
}

export default Home
