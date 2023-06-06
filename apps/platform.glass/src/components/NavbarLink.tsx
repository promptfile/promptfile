import { Text } from '@chakra-ui/react'
import { AppLink } from '../utilities/AppLink'

interface NavbarLinkProps {
  text: string
  href: string
}

export const NavbarLink = (props: NavbarLinkProps) => {
  const { text, href } = props

  return (
    <AppLink href={href}>
      <Text fontSize="16px" _hover={{ color: 'brand.400' }} textColor="#eeeeee">
        {text}
      </Text>
    </AppLink>
  )
}
