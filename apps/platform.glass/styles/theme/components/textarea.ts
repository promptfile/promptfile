import { mode, StyleFunctionProps, transparentize } from '@chakra-ui/theme-tools'

const variants = {
  outline: (props: StyleFunctionProps) => ({
    borderRadius: 'lg',
    bg: mode('white', 'gray.800')(props),
    _hover: { borderColor: mode('gray.300', 'gray.600')(props) },
    _focus: {
      borderColor: mode('brand.500', 'brand.200')(props),
      boxShadow: mode(
        `0px 0px 0px 1px ${transparentize(`brand.500`, 1.0)(props.theme)}`,
        `0px 0px 0px 1px ${transparentize(`brand.200`, 1.0)(props.theme)}`,
      )(props),
    },
  }),
}

export default {
  variants,
}
