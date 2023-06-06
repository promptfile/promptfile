import { Box, Divider, HStack, Image, Stack, Text } from '@chakra-ui/react'
import { CommitBadge } from './CommitBadge'
import { DeploymentRow } from './DeploymentRow'

export const CommitDeploymentView = () => {
  return (
    <Stack ps="27px" pe={'21px'} spacing={0}>
      <HStack pb={'12px'} pt={'16px'} spacing={'16px'} ps={'2px'}>
        <Image src="/commit/icon-commit-status-spinner-medium@3x.png" alt="spinner" width="20px" height="20px" />
        <Text fontSize="16px" color="#eeeeee">
          Deploying
        </Text>
        <CommitBadge commitHash={'d2afe3'} deploying />
      </HStack>
      <Box px={'4px'}>
        <Divider borderColor="white" opacity={0.08} />
      </Box>
      <DeploymentRow text={'Checked out code'} />
      <DeploymentRow text={'Transpiled to Python'} />
      <DeploymentRow text={'Deploying model'} running={true} />
    </Stack>
  )
}
