import { mode, StyleFunctionProps } from '@chakra-ui/theme-tools'

export default {
  global: (props: StyleFunctionProps) => ({
    body: {
      color: 'default',
      bg: 'bg-canvas',
    },
    '*::placeholder': {
      opacity: 1,
      color: 'subtle',
    },
    '*, *::before, &::after': {
      borderColor: mode('gray.200', 'gray.700')(props),
    },
  }),
}
