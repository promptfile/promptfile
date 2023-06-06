import { Text } from '@chakra-ui/react'
import { AppLink } from '../utilities/AppLink'

interface FooterLinkProps {
  text: string
  href: string
}

export const FooterLink = (props: FooterLinkProps) => {
  const { text, href } = props

  return (
    <AppLink href={href}>
      <Text textColor="grey.500" fontSize="16px" _hover={{ color: 'brand.400' }}>
        {text}
      </Text>
    </AppLink>
  )
}
