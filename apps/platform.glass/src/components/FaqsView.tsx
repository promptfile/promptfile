import { Stack, Text } from '@chakra-ui/react'
import { FaqView } from './FaqView'

export const FaqsView = () => {
  return (
    <Stack height="full" py={'96px'} width={['326px', '656px']} alignItems="center" spacing={'36px'}>
      <Text fontSize={['41px', '49px']} pb={'28px'} letterSpacing={'-0.41px'} textColor="white">
        Frequently Asked Questions
      </Text>
      <FaqView
        question={'What is Glass?'}
        answers={['Glass is a declarative framework for building applications with language models.']}
      />
      <FaqView
        question={'What is Glass Platform?'}
        answers={[
          `Glass Platform provides hosting and infrastructure for Glass. It's a place to build, share, and collaborate on Glass apps.`,
        ]}
      />
    </Stack>
  )
}
