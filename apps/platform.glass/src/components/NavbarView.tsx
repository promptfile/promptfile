import { Button, HStack, IconButton, Text, useBreakpointValue, useDisclosure } from '@chakra-ui/react'
import { FiArrowRightCircle } from 'react-icons/fi'
import { TbMenu2 } from 'react-icons/tb'
import { AppLink } from '../utilities/AppLink'
import { DOCS_URL, SUPPORT_URL } from '../utilities/constants'
import { NavbarLink } from './NavbarLink'
import { NavbarModal } from './NavbarModal'

interface NavbarViewProps {
  gradient?: string
}

export const NavbarView = (props: NavbarViewProps) => {
  const { gradient } = props
  const isMobile = useBreakpointValue({ base: true, lg: false })

  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <HStack width="full" justifyContent="space-between" py="40px" px={['20px', '40px']} bgGradient={gradient}>
        <AppLink href="/">
          <Text fontWeight="bold" fontSize="2xl" letterSpacing={'widest'}>
            GLASS
          </Text>
        </AppLink>
        <HStack spacing={'64px'}>
          {!isMobile && (
            <HStack spacing={'32px'}>
              <NavbarLink href={SUPPORT_URL} text="Contact" />
            </HStack>
          )}
          {isMobile ? (
            <IconButton
              _hover={{ bg: 'brand.400' }}
              borderRadius="sm"
              color="white"
              bg={'brand.500'}
              icon={<TbMenu2 />}
              aria-label="menu"
              onClick={onOpen}
            />
          ) : (
            <AppLink href={DOCS_URL}>
              <Button
                borderRadius={'sm'}
                color="white"
                variant="solid"
                bg="brand.500"
                fontWeight="bold"
                _hover={{ bg: 'brand.400' }}
              >
                <HStack>
                  <Text px={2}>View docs</Text>
                  <FiArrowRightCircle />
                </HStack>
              </Button>
            </AppLink>
          )}
        </HStack>
      </HStack>
      {isMobile && <NavbarModal isOpen={isOpen} onClose={onClose} />}
    </>
  )
}
