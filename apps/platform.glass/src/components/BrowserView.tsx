import { Box, Button, Circle, HStack, Icon, Image, Stack, Text } from '@chakra-ui/react'
import { FiArrowRightCircle, FiCheck } from 'react-icons/fi'

export const BrowserView = () => {
  return (
    <Stack
      zIndex={'2'}
      overflow="hidden"
      boxShadow="2xl"
      width="full"
      borderRadius="lg"
      spacing={0}
      bg="rgba(30, 41, 59, 0.4)"
      borderWidth="1px"
      borderColor={'rgba(30, 41, 59, 0.5)'}
    >
      <HStack width="full" px="14px" py={'14px'} justifyContent="space-between">
        <HStack width="full">
          <Circle size="12px" bg="rgba(30, 41, 59, 0.9)" />
          <Circle size="12px" bg="rgba(30, 41, 59, 0.9)" />
          <Circle size="12px" bg="rgba(30, 41, 59, 0.9)" />
        </HStack>
        <Text
          borderRadius="md"
          lineHeight="1.5"
          textAlign={'center'}
          fontSize="11px"
          color="#475569"
          width="full"
          bg="rgba(30, 41, 59, 0.9)"
          py={'2px'}
        >
          platform.glass
        </Text>
        <Box width="full" />
      </HStack>
      <Stack
        bg="black.500"
        width="full"
        px={['12px', '48px', '160px']}
        py={['24px', '48px', '50px']}
        alignItems="center"
      >
        <Stack
          width="full"
          justifyContent="space-between"
          direction={['column', 'row', 'row']}
          alignItems="center"
          spacing={['24px', '0px', '0px']}
        >
          <HStack fontSize="19px">
            <Image src="/commit/avatar-3-piioh@3x.png" alt="3po" width="42px" height="42px" />
            <Text color="grey.500">3piioh</Text>
            <Text color="grey.500">/</Text>
            <Text color="white">comeback-practice</Text>
          </HStack>
          <HStack spacing={4}>
            <HStack>
              <Icon as={FiCheck} color="green.400" />
              <Text fontFamily="mono" color={'grey.600'}>
                b8c16e
              </Text>
            </HStack>
            <Button color="white" bg="brand.500" borderRadius="sm" _hover={{ bg: 'brand.400' }}>
              <HStack fontSize="16px" fontWeight="bold">
                <Text>Deploy</Text>
                <Icon as={FiArrowRightCircle} />
              </HStack>
            </Button>
          </HStack>
        </Stack>
        <Box width="full" height="full" pt={['34px']} px={['12px', '0px', '0px']}>
          <Stack width="full" bg="rgba(0, 0, 0, 0.25)" py={'12px'} px={'12px'} borderRadius="16px" spacing={['24px']}>
            <HStack width="full" justifyContent="flex-end">
              <Stack width="full" alignItems="flex-end" spacing={'6px'}>
                <HStack>
                  <Text textColor="grey.500" fontSize="11px">
                    you
                  </Text>
                  <Text textColor="grey.600" fontSize="11px">
                    11:55
                  </Text>
                </HStack>
                <Text
                  bg="slate.800"
                  fontSize="16px"
                  p={'16px'}
                  borderBottomRadius="lg"
                  borderTopLeftRadius={'lg'}
                  color="white"
                >
                  and if R2 says, “you’re a mindless philosopher!”?
                </Text>
              </Stack>
            </HStack>
            <Stack alignItems="flex-start" width="full" spacing={'6px'}>
              <HStack>
                <Text textColor="grey.500" fontSize="11px">
                  comeback-practice
                </Text>
                <Text textColor="grey.600" fontSize="11px">
                  11:55
                </Text>
              </HStack>
              <Text
                bg="black.500"
                color="grey.500"
                fontSize="16px"
                p={'16px'}
                borderBottomRadius="lg"
                borderTopRightRadius={'lg'}
                maxW={['70%']}
              >
                You say, “Don’t call me a ‘mindless philosopher,’ you glob of grease!”
              </Text>
            </Stack>
            <HStack
              bg="#242424"
              borderWidth="1px"
              borderColor={'rgba(63, 63, 63, 0.75)'}
              px={'16px'}
              py="12px"
              borderRadius="lg"
              fontSize="16px"
              textColor="grey.600"
              justifyContent={'space-between'}
            >
              <Text>Try something new...</Text>
              <Text fontWeight="bold">Send</Text>
            </HStack>
          </Stack>
        </Box>
      </Stack>
    </Stack>
  )
}
