import { Stack, Text } from '@chakra-ui/react'
import { CollabRow } from './CollabRow'

export const PricingCollabView = () => {
  return (
    <Stack
      height="full"
      pt={'144px'}
      pb={'96px'}
      width={['320px', '474px', '960px']}
      spacing="64px"
      alignItems="center"
      direction={['column', 'column', 'row']}
      justifyContent={['center', 'space-between']}
    >
      <Stack spacing={0}>
        <Text fontSize="16px" fontWeight="bold" textColor="#eeeeee">
          COMMUNITY
        </Text>
        <Text pt={'16px'} fontSize={['41px', '49px']} letterSpacing={'-0.49px'} lineHeight="1.1" textColor={'white'}>
          Collab with friends for free
        </Text>
        <Text textColor="grey.500" pt={'8px'}>
          Forever-free collaboration tools. Deploy in public or private as you like.
        </Text>
      </Stack>
      <Stack
        direction={['column', 'row', 'row']}
        spacing={['32px', '32px', '64px']}
        alignSelf="flex-start"
        width="full"
      >
        <Stack width="full">
          <CollabRow text="Unlimited repositories" />
          <CollabRow text="Unlimited collaborators" />
          <CollabRow text="Unlimited storage" />
          <CollabRow text="Unlimited orgs" />
        </Stack>
        <Stack width="full">
          <CollabRow check text="Automatic retraining" />
          <CollabRow check text="One-click deploy" />
          <CollabRow check text="Multiplayer console" />
          <CollabRow check text="Org-level controls" />
        </Stack>
      </Stack>
    </Stack>
  )
}
