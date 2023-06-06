import {
  Box,
  Button,
  HStack,
  IconButton,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Stack,
} from '@chakra-ui/react'
import { TbX } from 'react-icons/tb'
import { AppLink } from '../utilities/AppLink'
import { DOCS_URL } from '../utilities/constants'
import { NavbarModalLink } from './NavbarModalLink'

interface NavbarModalProps {
  isOpen: boolean
  onClose: () => void
}

export const NavbarModal = (props: NavbarModalProps) => {
  const { isOpen, onClose } = props

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalOverlay />
      <ModalContent p={0}>
        <ModalBody bg="slate.900" p={0}>
          <HStack
            width="full"
            justifyContent="space-between"
            py="40px"
            px={'20px'}
            borderBottomWidth="1px"
            borderBottomColor={'grey.500'}
          >
            <AppLink href="/">
              <Image src="/logos/logotype-block-horizontal@2x.png" alt={'logo'} height="26px" />
            </AppLink>
            <IconButton
              _hover={{ bg: 'brand.400' }}
              borderRadius="sm"
              color="white"
              bg={'brand.500'}
              icon={<TbX />}
              aria-label="menu"
              onClick={onClose}
            />
          </HStack>
          <Stack width="full" height="full" pt={'48px'} spacing="32px" px={'24px'}>
            <NavbarModalLink text="Platform" href="/" />
            <NavbarModalLink text="Pricing" href="/pricing" />
            <NavbarModalLink text="Docs" href={DOCS_URL} />
            <NavbarModalLink text="Register" href={DOCS_URL} />
            <Box width="full" height="full" pt={'32px'}>
              <AppLink href={DOCS_URL}>
                <Button
                  width="full"
                  color="white"
                  bg={'brand.500'}
                  size="xl"
                  fontWeight="bold"
                  letterSpacing={'0.23px'}
                  lineHeight="1.5"
                  _hover={{ bg: 'brand.400' }}
                >
                  Sign in
                </Button>
              </AppLink>
            </Box>
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
