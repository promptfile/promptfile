const baseStyle = {
  color: 'emphasized',
  mb: '1.5',
  fontSize: 'sm',
}

const sizes = {
  sm: {
    _peerPlaceholderShown: {
      fontSize: 'sm',
      top: '1.5',
      left: '4',
    },
  },
  md: {
    _peerPlaceholderShown: {
      fontSize: 'md',
      top: '2',
      left: '4',
    },
  },
  lg: {
    _peerPlaceholderShown: {
      fontSize: 'lg',
      top: '2.5',
      left: '4',
    },
  },
}

const variants = {
  inline: () => ({
    margin: 0,
    minW: '2xs',
  }),
  floating: () => ({
    position: 'absolute',
    transition: 'all 0.12s ease-in',
    pointerEvents: 'none',
    top: '-27px',
    left: '0',
    _peerPlaceholderShown: {
      fontWeight: 'normal',
      color: 'subtle',
    },
    _peerFocus: {
      fontSize: 'sm',
      fontWeight: 'medium',
      top: '-27px',
      left: '0',
      color: 'muted',
    },
  }),
}

const defaultProps = {
  size: 'md',
}

export default {
  baseStyle,
  sizes,
  variants,
  defaultProps,
}
