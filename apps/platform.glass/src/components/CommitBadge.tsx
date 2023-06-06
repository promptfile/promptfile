import { Circle, HStack, Icon, Text } from '@chakra-ui/react'
import { FiCheck } from 'react-icons/fi'

interface CommitBadgeProps {
  commitHash: string
  deploying?: boolean
}

export const CommitBadge = (props: CommitBadgeProps) => {
  const { commitHash, deploying } = props

  return (
    <HStack bg="#303133" borderRadius="md" px={2}>
      {deploying ? (
        <Circle
          bgGradient={'linear(to-t, #f7ce68, #fbab7e)'}
          size="10px"
          borderWidth="1px"
          borderColor="rgba(30, 41, 59, 0.8)"
        />
      ) : (
        <Icon as={FiCheck} color="green.400" />
      )}
      <Text color="grey.500" fontSize="17px" fontFamily="mono">
        {commitHash}
      </Text>
    </HStack>
  )
}
