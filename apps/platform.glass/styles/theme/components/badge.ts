import { darken, mode, StyleFunctionProps, transparentize } from '@chakra-ui/theme-tools'

const baseStyle = {
  textTransform: 'normal',
  fontWeight: 'medium',
  borderRadius: '2xl',
}

const sizes = {
  lg: {
    fontSize: 'sm',
    px: '3',
    py: '1',
  },
  md: {
    fontSize: 'sm',
    lineHeight: '1.25rem',
    px: '2.5',
    py: '0.5',
  },
  sm: {
    fontSize: 'xs',
    lineHeight: '1.5',
    px: '2',
    py: '0.5',
  },
}

const variants = {
  subtle: (props: StyleFunctionProps) => ({
    bg: mode(
      darken(`${props.colorScheme}.50`, 2)(props.theme),
      transparentize(`${props.colorScheme}.200`, 0.16)(props.theme),
    )(props),
  }),
}

const defaultProps = {
  size: 'md',
  variant: 'subtle',
}

export default {
  baseStyle,
  defaultProps,
  variants,
  sizes,
}
