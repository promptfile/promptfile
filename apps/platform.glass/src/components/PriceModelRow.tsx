import { HStack, Text } from '@chakra-ui/react'

interface PriceModelRowProps {
  modelName: string
  trainPrice: string
  usePrice: string
}

export const PriceModelRow = (props: PriceModelRowProps) => {
  const { modelName, trainPrice, usePrice } = props

  return (
    <HStack width="full" fontSize="13px" bg="slate.800" px={'16px'} py={'18px'} textColor="white">
      <Text width="full">{modelName}</Text>
      <Text width="full">{trainPrice}</Text>
      <Text width="full">{usePrice}</Text>
    </HStack>
  )
}
