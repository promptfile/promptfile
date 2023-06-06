import { chakra, Image, Stack, Text } from '@chakra-ui/react'
import { ReactElement } from 'react'

interface HeroBoxProps {
  iconName: any
  titleBold: string
  titleRegular: string
  description: ReactElement
}

export const HeroBox = (props: HeroBoxProps) => {
  const { iconName, titleBold, titleRegular, description } = props
  return (
    <Stack
      spacing={0}
      width="full"
      borderWidth="1px"
      px={'24px'}
      py={'24px'}
      borderRadius="2xl"
      borderColor="slate.800"
      backdropFilter="auto"
      backdropBlur={'5px'}
      bg="rgba(30, 41, 59, 0.01)"
    >
      <Image src={`/hero/icon-hero-feature-${iconName}@3x.png`} alt="icon" height="48px" width="48px" />
      <Text fontSize="19px" color="grey.500" pt={'24px'} pb={'12px'}>
        <chakra.span color="white" fontWeight="bold">
          {titleBold}
        </chakra.span>{' '}
        {titleRegular}
      </Text>
      <chakra.span fontSize="16px" lineHeight={'1.5'} textColor="grey.500">
        {description}
      </chakra.span>
    </Stack>
  )
}
