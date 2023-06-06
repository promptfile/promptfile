import { Button, HStack, Icon, Stack, Text } from '@chakra-ui/react'
import { TbCircleCheck, TbInfinity } from 'react-icons/tb'
import { AppLink } from '../utilities/AppLink'
import { BaseModelSwitcher } from './BaseModelSwitcher'
import { PricingTable } from './PricingTable'

export const PriceView = () => {
  return (
    <Stack
      pt={['48px', '128px']}
      width={['342px', '658px', '1029px']}
      spacing={['48px', '64px', '80px']}
      justifyContent="space-between"
      alignItems="flex-start"
      direction={['column', 'row', 'row']}
    >
      <Stack pt={'48px'} spacing={0}>
        <Text
          fontSize={['41px', '41px', '59px']}
          lineHeight="1.1"
          letterSpacing={'-0.41px'}
          bgClip="text"
          width="fit-content"
          bgGradient={'linear(to-r, #deecdd, #c1dfc4)'}
        >
          Free repos
        </Text>
        <Text fontSize="16px" color="grey.500" pt={'16px'} pb={'32px'}>
          Forever-free collaboration tools. Deploy in public or private as you like.
        </Text>
        <Stack fontWeight="bold" fontSize="16px" color="white" spacing={1.5}>
          <HStack>
            <Icon as={TbInfinity} color="green.400" />
            <Text>Unlimited repositories</Text>
          </HStack>
          <HStack>
            <Icon as={TbInfinity} color="green.400" />
            <Text>Unlimited collaborators</Text>
          </HStack>
          <HStack>
            <Icon as={TbInfinity} color="green.400" />
            <Text>Unlimited storage</Text>
          </HStack>
          <HStack>
            <Icon as={TbCircleCheck} color="green.400" />
            <Text>One-click retraining</Text>
          </HStack>
          <HStack>
            <Icon as={TbCircleCheck} color="green.400" />
            <Text>One-click deploy</Text>
          </HStack>
        </Stack>
      </Stack>
      <Stack bg="rgba(30, 41, 59, 0.4)" borderRadius="24px" px={['24px', '24px', '80px']} py={'48px'} spacing={0}>
        <Text
          alignSelf={['center', 'flex-start']}
          textAlign="center"
          bgGradient={'linear(to-l, #a1c4fd, #c2e9fb)'}
          bgClip="text"
          width="fit-content"
          fontSize={['41px', '41px', '59px']}
          lineHeight="1.1"
          letterSpacing={'-0.41px'}
        >
          Fair compute
        </Text>
        <Text fontSize="16px" color="grey.500" pt={'16px'} pb={'32px'}>
          We only charge for model training and execution. Pay fair market rates for compute cycles based on your base.
        </Text>
        <Stack>
          <BaseModelSwitcher />
          <PricingTable />
          <AppLink href="/pricing">
            <Button
              width="full"
              bg="brand.500"
              borderRadius={'sm'}
              fontWeight="bold"
              _hover={{ bg: 'brand.400' }}
              color="white"
            >
              See all pricing
            </Button>
          </AppLink>
        </Stack>
      </Stack>
    </Stack>
  )
}
