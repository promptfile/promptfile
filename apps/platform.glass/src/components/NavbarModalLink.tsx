import { TriangleDownIcon } from '@chakra-ui/icons'
import { HStack, Icon, Text } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { AppLink } from '../utilities/AppLink'

interface NavbarModalLinkProps {
  href: string
  text: string
}

export const NavbarModalLink = (props: NavbarModalLinkProps) => {
  const { href, text } = props
  const router = useRouter()
  const isActive = router.pathname === href
  return (
    <AppLink href={href}>
      <HStack color={isActive ? 'blue.600' : 'white'} spacing={'16px'}>
        <Text fontSize="34px" lineHeight="1.3" letterSpacing={'-0.34px'}>
          {text}
        </Text>
        {isActive && <Icon as={TriangleDownIcon} fontSize="24px" transform={'rotate(90deg)'} />}
      </HStack>
    </AppLink>
  )
}
