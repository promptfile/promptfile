import { Circle } from '@chakra-ui/react'

export const CommitDarkDot = () => {
  return (
    <Circle size="14px" bg="black.500" transform="translateX(-6px);">
      <Circle size="6px" bg="#3f3f3f" />
    </Circle>
  )
}
