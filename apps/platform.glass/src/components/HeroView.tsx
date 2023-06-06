import { chakra, HStack, Icon, Image, Stack, Text } from '@chakra-ui/react'
import { FiArrowRightCircle } from 'react-icons/fi'
import { AppLink } from '../utilities/AppLink'
import { DOCS_URL } from '../utilities/constants'
import { HeroBox } from './HeroBox'

export const HeroView = () => {
  return (
    <Stack
      pt={['96px', '128px', '176px']}
      alignItems="center"
      width="full"
      spacing={0}
      pb={'118px'}
      maxW={['294px', '738px', '1232px']}
    >
      <Stack width="full" alignItems="center" spacing={'8px'}>
        <chakra.span
          lineHeight={'1.2'}
          letterSpacing="-0.85px"
          fontSize={['49px', '85px', '85px']}
          fontWeight="bold"
          bgGradient={'linear-gradient(270deg, #6A82FB 0%, #FC5C7D 100%)'}
          bgClip="text"
          height="fit-content"
          width="fit-content"
          textAlign="center"
          // backdropFilter={'blur(4px)'}
        >
          Build with Glass
        </chakra.span>
        <Stack direction={['column', 'row', 'row']} spacing={'24px'} alignItems="center">
          <Text textAlign="center" fontSize="19px" textColor="white">
            A managed deployment platform for the <AppLink href={DOCS_URL}>Glass framework</AppLink>.
          </Text>
          <AppLink href={DOCS_URL}>
            <HStack spacing={1.5} color="grey.500" _hover={{ color: 'brand.500' }}>
              <Text fontWeight="bold">START NOW</Text>
              <Icon as={FiArrowRightCircle} />
            </HStack>
          </AppLink>
        </Stack>
      </Stack>
      <Stack
        py={'100px'}
        color="grey.600"
        spacing={['40px', '40px', '64px']}
        direction={['column', 'column', 'row']}
        alignItems="center"
        // opacity={0}
      >
        <Text fontWeight="bold" fontSize="13px" textAlign={['center', 'center', 'left']}>
          WORKS WITH
        </Text>
        <Stack direction={['column', 'row', 'row']} spacing={['32px', '32px', '48px']} alignItems="center">
          <AppLink href="https://openai.com" isExternal>
            <Image maxH="27px" src="/openai/logo-hero-openai@3x.png" alt="OpenAI" />
          </AppLink>
          <AppLink href="https://anthropic.com" isExternal>
            <Image height="16px" src="/anthropic/logo-hero-anthropic@3x.png" alt="Anthropic" />
          </AppLink>
          {/* <AppLink href="https://cohere.com" isExternal>
            <Image maxH="32px" src="/cohere/logo-hero-cohere@3x.png" alt="cohere" />
          </AppLink> */}
        </Stack>
      </Stack>
      <Stack
        spacing={'32px'}
        justifyContent="space-between"
        direction={['column', 'column', 'row']}
        width={['294px', '546px', 'full']}
      >
        <HeroBox
          titleBold="Declarative"
          titleRegular="approach"
          iconName={'unlimited-repos'}
          description={
            <>
              Using the{' '}
              <AppLink href={DOCS_URL}>
                <chakra.span textDecoration={'underline'}>Glass framework</chakra.span>
              </AppLink>
              , you can build full AI applications with just a few lines of code.
            </>
          }
        />
        <HeroBox
          titleBold={'Managed'}
          titleRegular={'deployment'}
          description={
            <>
              From hosting to storage, we manage your Glass application for you. Focus on building your application and
              we will do the rest.
            </>
          }
          iconName={'commits-and-branches'}
        />
        <HeroBox
          titleBold={'Scale'}
          titleRegular={'effortlessly'}
          description={
            <>
              Glass Platform is specifically designed to handle your next viral project. Never worry about running out
              of compute or storage.
            </>
          }
          iconName={'fork-open-src-projects'}
        />
      </Stack>
    </Stack>
  )
}
