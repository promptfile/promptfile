import { CenterProps, Circle } from '@chakra-ui/react'

export const CommitPendingCircle = (props: CenterProps) => {
  return (
    <Circle
      bgGradient={'linear(to-t, #f7ce68, #fbab7e)'}
      size="10px"
      borderWidth="1px"
      borderColor="rgba(30, 41, 59, 0.8)"
      {...props}
    />
  )
}
