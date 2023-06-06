import { Button, chakra, HStack, Icon, Image, Stack, Text } from '@chakra-ui/react'
import { FiArrowRightCircle } from 'react-icons/fi'
import { BaseModelSwitcher } from './BaseModelSwitcher'
import { PricingTable } from './PricingTable'

export const TokenView = () => {
  return (
    <Stack height="full" py={'96px'} width={['294px', '480px', '1008px']} alignItems="center" spacing={0}>
      <Text fontSize={['41px', '49px']} lineHeight="1.1" letterSpacing={'-0.41px'} textColor="white">
        Pay per token
      </Text>
      <Text fontSize={['16px', '19px']} pt={'16px'} color="#eeeeee" textAlign={['center', 'center', 'left']}>
        Pay fair market rates per 1k tokens trained or executed. Start risk-free with free credit.
      </Text>
      <Stack width="full" pt={'64px'} spacing="96px" direction={['column', 'column', 'row']}>
        <Stack width="full">
          <BaseModelSwitcher iconBg="black" />
          <PricingTable headerBg="black" />
        </Stack>
        <Stack width="full" spacing="24px">
          <Stack
            p={'24px'}
            borderWidth="1px"
            bgGradient={'linear(to-r, #0f0c29, #24243e)'}
            spacing={0}
            borderRadius={'16px'}
            borderColor="#667eea"
          >
            <Image src={'pricing/logo-outline@3x.png'} height="48px" alt="logo" width="53.5px" />
            <HStack pt={'24px'} pb="12px" spacing={0}>
              <chakra.span textColor="white" fontSize="19px" alignSelf="flex-start">
                $
              </chakra.span>
              <Text fontSize="28px" lineHeight="1.5" textColor="grey.500">
                <chakra.span textColor="white">50</chakra.span> in free credit
              </Text>
            </HStack>
            <Text fontSize="16px" lineHeight={'1.5'} color={'grey.500'}>
              Free with signup. Start your next project right now. No credit card required.
            </Text>
          </Stack>
          <Button color="white" bg="brand.500" _hover={{ bg: 'brand.400' }} borderRadius="sm" py={'8'}>
            <HStack fontWeight="bold" fontSize="23px" spacing={2.5}>
              <Text>Start now</Text>
              <Icon as={FiArrowRightCircle} />
            </HStack>
          </Button>
        </Stack>
      </Stack>
    </Stack>
  )
}
