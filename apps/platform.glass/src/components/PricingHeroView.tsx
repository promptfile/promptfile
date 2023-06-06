import { Stack, Text } from '@chakra-ui/react'
import { PricingHeroBox } from './PricingHeroBox'

export const PricingHeroView = () => {
  return (
    <Stack height="full" pt={'108px'} pb={'96px'} spacing={0} width={['326px', '730px', '730px']} alignItems="center">
      <Text fontSize={['13px', '16px']} fontWeight="bold" color="#eeeeee">
        FREE TO START
      </Text>
      <Text
        letterSpacing={'-0.49px'}
        fontSize={['49px', '71px']}
        bgGradient={'linear(to-l, #a1c4fd 100%, #c2e9fb 0%)'}
        bgClip="text"
        width="fit-content"
        lineHeight="shorter"
        textAlign={'center'}
      >
        Cheap to scale
      </Text>
      <Stack direction={['column', 'row', 'row']} pt={'32px'}>
        <PricingHeroBox
          titleBold="Free"
          titleRegular="collaboration"
          description="Spin up unlimited repos, collaborators, and training data. Work in private or publish to your community, all for free."
          iconName="people-friends"
        />
        <PricingHeroBox
          titleBold="Fair"
          titleRegular="compute"
          description="We only charge for model training and execution. You get fair rates per token trained or predicted."
          iconName="various-scale"
        />
        <PricingHeroBox
          titleBold="Affordable"
          titleRegular="price"
          description="Use the right model for the job. We offer the full range of foundation models from OpenAI, Anthropic, and Cohere."
          iconName="system-adjustments"
        />
      </Stack>
    </Stack>
  )
}
