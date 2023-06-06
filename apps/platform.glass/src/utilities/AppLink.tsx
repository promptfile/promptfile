import { Link as ChakraLink, LinkProps as ChakraLinkProps } from '@chakra-ui/react'
import NextLink, { LinkProps as NextLinkProps } from 'next/link'
import { useRouter } from 'next/router'
import React, { ReactNode, useCallback } from 'react'

export interface AppLinkProps extends React.PropsWithChildren<NextLinkProps & ChakraLinkProps> {}

export function AppLink(props: AppLinkProps) {
  const { children, ...p } = props
  return (
    // https://dev.to/yuridevat/how-to-add-styling-to-an-active-link-in-nextjs-593e
    <NextLink {...(p as any)} passHref>
      <ChakraLink _hover={{ textDecoration: 'none' }} {...p}>
        {children}
      </ChakraLink>
    </NextLink>
  )
}

export const ActiveLink: React.FC<{ href: string; children?: ReactNode | undefined }> = ({ children, href }) => {
  const router = useRouter()

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        router.push(href).catch(e => console.error(e))
      }
    },
    [href, router]
  )

  return (
    <ChakraLink
      href={href}
      onClick={handleClick}
      style={{ fontWeight: router.asPath === href ? 'bold' : 'normal' }}
      _hover={{
        textDecoration: 'none',
      }}
    >
      {children}
    </ChakraLink>
  )
}
