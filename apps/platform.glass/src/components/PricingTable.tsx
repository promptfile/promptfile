import { chakra, HStack, Stack, Text } from '@chakra-ui/react'
import { PriceModelRow } from './PriceModelRow'

interface PricingTableProps {
  headerBg?: string
}

export const PricingTable = (props: PricingTableProps) => {
  const { headerBg } = props
  return (
    <Stack spacing={0} borderRadius="lg" overflow="hidden">
      <HStack width="full" bg={headerBg ?? 'black.500'} px={'16px'} py={'18px'} fontSize="13px" fontWeight="bold">
        <Text width="full" textColor="white">
          Model
        </Text>
        <Text width="full" textColor="white">
          Train{' '}
          <chakra.span ps={1} fontWeight="normal" color="grey.500">
            / 1k tokens
          </chakra.span>
        </Text>
        <Text width="full" textColor="white">
          Use{' '}
          <chakra.span ps={1} fontWeight="normal" color="grey.500">
            / 1k tokens
          </chakra.span>
        </Text>
      </HStack>
      <PriceModelRow modelName="ada" trainPrice="$0.0004" usePrice="$0.0016" />
      <PriceModelRow modelName="babbage" trainPrice="$0.0006" usePrice="$0.0024" />
      <PriceModelRow modelName="curie" trainPrice="$0.009" usePrice="$0.012" />
      <PriceModelRow modelName="davinci" trainPrice="$0.003" usePrice="$0.12" />
    </Stack>
  )
}
