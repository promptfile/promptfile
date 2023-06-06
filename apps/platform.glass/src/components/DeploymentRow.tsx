import { Box, Divider, HStack, Icon, Text } from '@chakra-ui/react'
import { FiCheck } from 'react-icons/fi'
import { CommitPendingCircle } from './CommitPendingCircle'

interface DeploymentRowProps {
  text: string
  running?: boolean
  pending?: boolean
}

export const DeploymentRow = (props: DeploymentRowProps) => {
  const { text, pending, running } = props
  return (
    <>
      <HStack bg={running ? 'black' : undefined} py={'4px'} ps={'6px'} spacing={'16px'} borderRadius="lg">
        {running ? (
          <Box px={'4px'} alignItems="center">
            <CommitPendingCircle width="8px" height="8px" />
          </Box>
        ) : (
          <Icon as={FiCheck} color={'green.400'} opacity={pending ? 0 : 1} />
        )}
        <Text fontWeight="medium" lineHeight="1.5" fontSize="13px" textColor={running ? '#eeeeee' : 'grey.600'}>
          {text}
        </Text>
      </HStack>
      <Box px={'4px'}>
        <Divider borderColor="white" opacity={0.08} />
      </Box>
    </>
  )
}
