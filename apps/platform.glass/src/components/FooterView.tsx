import { Divider, Show, Stack, Text } from '@chakra-ui/react'
import { AppLink } from '../utilities/AppLink'
import { DOCS_URL } from '../utilities/constants'
import { FooterLinks } from './FooterLinks'

export const FooterView = () => {
  return (
    <Stack width="full" height="full" bg="slate.800" alignItems="center" py={'98px'}>
      <Stack
        maxW={['400px', '768px', '1232px']}
        width="full"
        px={'38px'}
        spacing={['16px', '16px', '24px']}
        alignItems={['center', 'center', 'flex-start']}
        direction={['column-reverse', 'column-reverse', 'column']}
      >
        <Stack
          pt={['96px', '96px', '0px']}
          direction={['column', 'column', 'row']}
          spacing={['16px', '16px', '40px']}
          alignItems={'center'}
          width="full"
          justifyContent={['center', 'center', 'flex-start']}
        >
          <AppLink href="/">
            <Text fontWeight="bold" fontSize="2xl" letterSpacing={'widest'}>
              GLASS
            </Text>
          </AppLink>
          <Text textAlign={['center', 'center', 'left']} maxW={'320px'} color="grey.500" fontSize="13" lineHeight="1.5">
            Declarative framework for language models.{<br />}
            <AppLink borderBottom="1px" href={DOCS_URL}>
              Start your next project with Glass.
            </AppLink>
          </Text>
        </Stack>
        <Divider borderColor="#475569" />
        <Stack
          direction={['column', 'column', 'row']}
          width="full"
          justifyContent={['center', 'center', 'space-between']}
          alignItems={{ sm: 'center', lg: undefined }}
          spacing={'48px'}
        >
          <Show above={'xl'}>
            <Text fontSize="11px" color="grey.600" textAlign={'center'}>
              Copyright ©2023. Made in California.
            </Text>
          </Show>
          <FooterLinks />
        </Stack>
      </Stack>
      <Show below={'xl'}>
        <Text fontSize="11px" color="grey.600" textAlign={'center'} pt={'64px'}>
          Copyright ©2023. Made in California.
        </Text>
      </Show>
    </Stack>
  )
}
