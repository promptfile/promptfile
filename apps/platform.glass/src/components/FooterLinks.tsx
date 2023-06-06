import { HStack } from '@chakra-ui/react'
import { DOCS_URL, SUPPORT_URL } from '../utilities/constants'
import { FooterLink } from './FooterLink'

export const FooterLinks = () => {
  return (
    <HStack fontSize="16px" spacing={'32px'} justifyContent={'space-between'}>
      <FooterLink href={SUPPORT_URL} text={'Contact'} />
      <FooterLink href={DOCS_URL} text={'Docs'} />
    </HStack>
  )
}
