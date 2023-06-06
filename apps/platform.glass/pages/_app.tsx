import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import '@fontsource/inter/variable.css'
import { AppProps } from 'next/app'
import { theme } from '../styles/theme/index'

function MyApp({ Component, pageProps }: AppProps) {
  const myTheme = extendTheme(
    {
      colors: { ...theme.colors, brand: theme.colors.blue },
      initialColorMode: 'dark',
      useSystemColorMode: false,
    },
    theme
  )

  return (
    <ChakraProvider theme={myTheme} resetCSS>
      <Component {...pageProps} />
    </ChakraProvider>
  )
}

export default MyApp
