import { chakra, Image, Stack, Text } from '@chakra-ui/react'

interface PricingHeroBoxProps {
  titleBold: string
  titleRegular: string
  description: string
  iconName: string
}

export const PricingHeroBox = (props: PricingHeroBoxProps) => {
  const { titleBold, titleRegular, description, iconName } = props
  return (
    <Stack width="full" p={'24px'} textColor="grey.500" alignItems="center" spacing={0}>
      <Image src={`/pricing/tabler-${iconName}@3x.png`} alt="icon" height="24px" width="24px" />
      <Text fontSize="19px" pt={'24px'}>
        <chakra.span color="white" fontWeight="bold">
          {titleBold}
        </chakra.span>
        {` `}
        {titleRegular}
      </Text>
      <Text fontSize="16px" textAlign={'center'} pt={'12px'}>
        {description}
      </Text>
    </Stack>
  )
}
