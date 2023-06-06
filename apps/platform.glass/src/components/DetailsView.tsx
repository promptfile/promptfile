import { Box, Button, Code, HStack, Icon, Stack, Text } from '@chakra-ui/react'
import { FiArrowRightCircle } from 'react-icons/fi'
import { TbBuildingWarehouse, TbServer, TbStairsUp } from 'react-icons/tb'
import { AppLink } from '../utilities/AppLink'
import { DOCS_URL } from '../utilities/constants'
import { DetailBox } from './DetailBox'

export const DetailsView = () => {
  return (
    <Stack width={['480px', '768px', '970px']} spacing="56px" p={'64px'}>
      <Stack width="full" justifyContent="space-between" spacing="48px" direction={['column', 'row', 'row']}>
        <DetailBox
          icon={TbStairsUp}
          titleBold="Fine-tuned"
          titleRegular="automatically"
          description={
            <>
              Season your model without any code. Commit new examples and watch the model fine-tune to the new data
              automatically.
            </>
          }
        />
        <DetailBox
          icon={TbServer}
          titleBold="REST"
          titleRegular="API"
          description={
            <>
              You get a stable API endpoint for each model. Dump your data with a{' '}
              <Code fontSize="17px" bg={'#303133'} textColor="grey.500">
                GET
              </Code>
              . Generate model responses with a{' '}
              <Code fontSize="17px" bg={'#303133'} textColor="grey.500">
                POST
              </Code>
              . Our API docs have demos in each language.
            </>
          }
        />
      </Stack>
      <Stack width="full" spacing="48px" justifyContent="space-between" direction={['column', 'row', 'row']}>
        <DetailBox
          icon={TbBuildingWarehouse}
          titleBold="Embeddings"
          titleRegular="built-in"
          description={
            <>
              Surface your best facts in every response. For each response get similarity scores to rows in your data
              tables. Search is easy once you have relevance.
            </>
          }
        />
        <Box width="full" bg="slate.800" borderRadius="xl">
          <Stack width="full" py={'24px'} px={'32px'} spacing={0}>
            <Text lineHeight="1.5" fontSize="28px" textColor="white">
              Ready to try?
            </Text>
            <Text fontSize="16px" lineHeight="1.5" color="grey.500" pt={'8px'} pb={'24px'}>
              Fork one of our base models to get started
            </Text>
            <AppLink href={DOCS_URL}>
              <Button
                size="lg"
                width="full"
                bg="brand.500"
                borderRadius="sm"
                color="white"
                _hover={{ bg: 'brand.400' }}
              >
                <HStack spacing={2.5} fontSize="23px">
                  <Text fontWeight="bold">Start now</Text>
                  <Icon as={FiArrowRightCircle} />
                </HStack>
              </Button>
            </AppLink>
          </Stack>
        </Box>
      </Stack>
    </Stack>
  )
}
