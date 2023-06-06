import { ColorModeScript, theme } from '@chakra-ui/react'
import NextDocument, { Head, Html, Main, NextScript } from 'next/document'

const env = process.env.NEXT_PUBLIC_ENVIRONMENT

export default class Document extends NextDocument {
  render() {
    return (
      <Html>
        <Head>
          <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
          <link rel="manifest" href="/favicon/site.webmanifest" />
        </Head>
        <body>
          <ColorModeScript initialColorMode={theme.config.initialColorMode} />
          <Main />
          <NextScript />
          {/* {env === 'prod' && <script src="//rum-static.pingdom.net/pa-61f5aac8405b1d001100073e.js" async />} */}
        </body>
      </Html>
    )
  }
}
