import { HStack, Icon, Text } from '@chakra-ui/react'
import { TbCircleCheck, TbInfinity } from 'react-icons/tb'

interface CollabRowProps {
  text: string
  check?: boolean
}

export const CollabRow = (props: CollabRowProps) => {
  const { text, check } = props
  return (
    <HStack>
      <Icon as={check ? TbCircleCheck : TbInfinity} color="green.400" />
      <Text fontWeight="bold" lineHeight="1.5" color="white">
        {text}
      </Text>
    </HStack>
  )
}
