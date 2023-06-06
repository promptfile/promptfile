import { HStack, Image, Stack, Text } from '@chakra-ui/react'
import { CommitBadge } from './CommitBadge'

interface CommitBoxProps {
  avatarName: string
  username: string
  commitHash: string
  deploying?: boolean
  commitMessage: string
  numRows: string
}

export const CommitBox = (props: CommitBoxProps) => {
  const { avatarName, username, commitHash, deploying, commitMessage, numRows } = props

  return (
    <Stack
      bg="#242424"
      borderWidth="1px"
      borderColor="#3f3f3f"
      py="12px"
      px="16px"
      borderRadius="xl"
      boxShadow={'0px 0px 100px rgba(13, 13, 13, 0.9)'}
      zIndex={3}
      spacing="8px"
      width={['310px', '428px', '428px']}
    >
      <HStack width="full" justifyContent="space-between">
        <HStack>
          <Image alt="obiwan" src={`/commit/avatar-${avatarName}@3x.png`} width="36px" height="36px" />
          <Text fontSize="19px" fontWeight="bold" textColor="white">
            {username}
          </Text>
        </HStack>
        <CommitBadge deploying={deploying} commitHash={commitHash} />
      </HStack>
      <Text color="grey.500" fontSize="16px">
        {commitMessage}
      </Text>
      <Text bgGradient={'linear(to-b, #96c93d, #00b09b)'} fontSize="11px" bgClip="text">
        +{numRows} rows
      </Text>
    </Stack>
  )
}
