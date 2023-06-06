import { HStack, Stack, Text } from '@chakra-ui/react'

interface FaqViewProps {
  question: string
  answers: string[]
}

export const FaqView = (props: FaqViewProps) => {
  const { question, answers } = props

  return (
    <Stack width="full" spacing={'10px'} px={['0px', '0px', '48px']}>
      <HStack width="full" justifyContent="space-between" color="white">
        <Text fontSize="23px" letterSpacing={'0.23px'}>
          {question}
        </Text>
        {/* <Icon as={ChevronDownIcon} height="24px" width="24px" /> */}
      </HStack>
      <Stack spacing="8px" width="full" height="full">
        {answers.map((answer, i) => (
          <Text key={i} color="grey.500">
            {answer}
          </Text>
        ))}
      </Stack>
    </Stack>
  )
}
