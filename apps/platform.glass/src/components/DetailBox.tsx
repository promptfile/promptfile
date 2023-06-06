import { chakra, Icon, Square, Stack, Text } from '@chakra-ui/react'
import { ReactElement } from 'react'
import { IconType } from 'react-icons'

interface DetailBoxProps {
  icon: IconType
  titleBold: string
  titleRegular: string
  description: ReactElement
}

export const DetailBox = (props: DetailBoxProps) => {
  const { icon, titleBold, titleRegular, description } = props
  return (
    <Stack width="full" spacing={['8px', '8px', '16px']} textColor="grey.500">
      <Square size="48px" bg="brand.500" borderRadius={'lg'}>
        <Icon as={icon} color="white" width="20px" height="20px" />
      </Square>
      <Text fontSize="19px">
        <chakra.span color="white" fontWeight="bold">
          {titleBold}
        </chakra.span>
        {` `}
        {titleRegular}
      </Text>
      <chakra.span fontSize="16px" lineHeight="1.5">
        {description}
      </chakra.span>
    </Stack>
  )
}
