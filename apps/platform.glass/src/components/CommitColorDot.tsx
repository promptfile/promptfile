import { Circle } from '@chakra-ui/react'

interface CommitColorDotProps {
  gradient: string
}

export const CommitColorDot = (props: CommitColorDotProps) => {
  const { gradient } = props
  return (
    <Circle size="14px" bgGradient={gradient} transform="translateX(-6px);">
      <Circle size="10px" bg="black.500">
        <Circle size="6px" bgGradient={gradient} />
      </Circle>
    </Circle>
  )
}
