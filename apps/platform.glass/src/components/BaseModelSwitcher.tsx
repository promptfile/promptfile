import { TriangleDownIcon } from '@chakra-ui/icons'
import { Circle, HStack, Icon, Text } from '@chakra-ui/react'
import { SiOpenai } from 'react-icons/si'

interface BaseModelSwitcherProps {
  iconBg?: string
}

export const BaseModelSwitcher = (props: BaseModelSwitcherProps) => {
  const { iconBg } = props
  return (
    <HStack fontSize="16px" spacing={4}>
      <Text color="grey.500">Base model</Text>
      <Text color="brand.500" fontWeight="bold">
        /
      </Text>
      <HStack>
        <Circle bg={iconBg ?? 'black.500'} size="30px">
          <Icon as={SiOpenai} color="grey.500" />
        </Circle>
        <Text color="white">OpenAI</Text>
        <Icon as={TriangleDownIcon} color="brand.500" />
      </HStack>
    </HStack>
  )
}
