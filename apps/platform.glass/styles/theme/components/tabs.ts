const baseStyle = {
  tab: {
    fontWeight: 'medium',
    color: 'muted',
    _focus: {
      boxShadow: 'none',
    },
    _focusVisible: {
      boxShadow: 'base',
    },
  },
}

const variants = {
  line: {
    tab: {
      _selected: {
        color: 'accent',
        borderColor: 'accent',
      },
      _active: {
        bg: 'transparent',
      },
    },
  },
  enclosed: {
    tab: {
      _selected: {
        color: 'accent',
      },
    },
  },
}

const sizes = {
  md: {
    tab: {
      fontSize: 'sm',
    },
  },
}

export default { baseStyle, variants, sizes }
