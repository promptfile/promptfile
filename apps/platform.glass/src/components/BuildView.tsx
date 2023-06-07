import { Box, Button, HStack, Stack, Text } from '@chakra-ui/react'
import { FiArrowRightCircle } from 'react-icons/fi'
import { AppLink } from '../utilities/AppLink'

export const BuildView = () => {
  return (
    <Stack
      width="full"
      justifyContent="space-between"
      w={['342px', '578px', '1232px']}
      py={'128px'}
      px={['0px', '38px']}
      spacing={['48px', '48px', '48px']}
      direction={['column', 'column', 'row']}
      alignItems="center"
    >
      <Stack spacing={'16px'}>
        <Text color="grey.600" fontWeight="bold">
          START NOW
        </Text>
        <Text fontSize="49px" lineHeight="1.1" letterSpacing="-0.49px" textColor="white">
          Build faster than ever
        </Text>
        <Text color="grey.500" maxW={'550px'}>
          Working on the next great LLM application? The Glass platform makes it easy to go from idea to deployment.
        </Text>
      </Stack>
      <Box width={['full', 'full', 'fit-content']}>
        <AppLink href="https://docs.glass">
          <Button
            size="xl"
            bg="brand.500"
            borderRadius="sm"
            color="white"
            fontWeight="bold"
            _hover={{ bg: 'brand.400' }}
            width="full"
          >
            <HStack fontSize="23px">
              <Text>View docs</Text>
              <FiArrowRightCircle />
            </HStack>
          </Button>
        </AppLink>
      </Box>
    </Stack>
  )
}
