import { darken, mode, StyleFunctionProps, transparentize } from '@chakra-ui/theme-tools'

const baseStyle = {
  ':focus:not(:focus-visible)': {
    boxShadow: 'none',
  },
  fontWeight: 'medium',
  borderRadius: 'lg',
}

const sizes = {
  lg: {
    fontSize: 'md',
  },
  xl: {
    h: '3.75rem',
    minW: '3.75rem',
    fontSize: 'lg',
    px: 7,
  },
}

const variants = {
  primary: (props: StyleFunctionProps) =>
    props.theme.components['Button']['variants']['solid']({
      ...props,
      variant: 'solid',
      colorScheme: 'brand',
    }),
  'primary-on-accent': () => ({
    bg: 'brand.50',
    color: 'brand.600',
    _hover: { bg: 'brand.100' },
    _active: { bg: 'brand.100' },
  }),
  secondary: (props: StyleFunctionProps) =>
    props.theme.components['Button']['variants']['outline']({
      ...props,
      variant: 'outline',
      colorScheme: 'gray',
    }),
  'secondary-on-accent': {
    color: 'white',
    borderColor: 'brand.50',
    borderWidth: '1px',
    _hover: { bg: 'whiteAlpha.200' },
    _active: { bg: 'whiteAlpha.200' },
  },
  outline: (props: StyleFunctionProps) => ({
    color: 'emphasized',
    bg: mode('white', 'gray.800')(props),
    _hover: {
      bg: mode(
        darken('gray.50', 1)(props.theme),
        transparentize('gray.700', 0.4)(props.theme),
      )(props),
    },
    _checked: {
      bg: mode('gray.100', 'gray.700')(props),
    },
    _active: {
      bg: mode('gray.100', 'gray.700')(props),
    },
  }),
  ghost: (props: StyleFunctionProps) => ({
    color: 'emphasized',
    _hover: {
      bg: mode(darken('gray.50', 1)(props.theme), darken('gray.700', 4)(props.theme))(props),
    },
    _active: {
      bg: mode(darken('gray.50', 1)(props.theme), darken('gray.700', 4)(props.theme))(props),
    },
    _activeLink: {
      bg: mode('gray.100', 'gray.700')(props),
    },
  }),
  'ghost-on-accent': (props: StyleFunctionProps) => ({
    color: 'brand.50',
    _hover: {
      bg: transparentize('brand.500', 0.67)(props.theme),
    },
    _activeLink: {
      color: 'white',
      bg: 'bg-accent-subtle',
    },
  }),
  link: (props: StyleFunctionProps) => {
    if (props.colorScheme === 'gray') {
      return {
        color: 'muted',
        _hover: {
          textDecoration: 'none',
          color: 'default',
        },
        _active: {
          color: 'default',
        },
      }
    }
    return {
      color: mode(`${props.colorScheme}.600`, `${props.colorScheme}.200`)(props),
      _hover: {
        color: mode(`${props.colorScheme}.700`, `${props.colorScheme}.300`)(props),
        textDecoration: 'none',
      },
      _active: {
        color: mode(`${props.colorScheme}.700`, `${props.colorScheme}.300`)(props),
      },
    }
  },
  'link-on-accent': () => {
    return {
      padding: 0,
      height: 'auto',
      lineHeight: 'normal',
      verticalAlign: 'baseline',
      color: 'brand.50',
      _hover: {
        color: 'white',
      },
      _active: {
        color: 'white',
      },
    }
  },
}

export default {
  baseStyle,
  variants,
  sizes,
}
