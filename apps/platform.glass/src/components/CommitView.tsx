import { Box, chakra, Image, Stack, Text, useBreakpointValue } from '@chakra-ui/react'
import { BrowserView } from './BrowserView'
import { CommitBox } from './CommitBox'
import { CommitColorDot } from './CommitColorDot'
import { CommitDarkDot } from './CommitDarkDot'
import { CommitDeploymentView } from './CommitDeploymentView'

export const CommitView = () => {
  const isMobile = useBreakpointValue({ base: true, lg: false })
  return (
    <Stack width={['390px', '900px', '1232px']} alignItems="center" position={'relative'}>
      <Box
        zIndex="0"
        left={['12px', '72px', '240px']}
        width="2px"
        height={['1808px', '1448px', '1482px']}
        position="absolute"
        bgGradient={'linear(to-r, rgba(48, 48, 48, 0), rgba(48, 48, 48, 0.85))'}
      >
        <Stack pt={'64px'}>
          <CommitDarkDot />
        </Stack>
        <Stack pt={['200px', '138px', '154px']}>
          <CommitColorDot gradient="linear(to-l, #ff9a9e, #fad0c4)" />
        </Stack>
        <Stack pt={'480px'}>
          <CommitDarkDot />
        </Stack>
        <Stack pt={['402px', '218px', '226px']} ps={['36px', '64px']}>
          <CommitColorDot gradient="linear(to-r, #fbc2eb, #a18cd1)" />
        </Stack>
      </Box>
      <Box zIndex="0" height="1000px" position="absolute" left={['14px', '6px', '174px']}>
        <Image
          top={['1195px', '948px', '975px']}
          width={['36px', '132px', '132px']}
          position="relative"
          src={`commit/timeline-branch${isMobile ? '-mobile' : ''}@3x.png`}
          alt="timeline"
        />
      </Box>
      <Stack width={['340px', '682px']} spacing={0} pt={'96px'} ps={['16px', '0', '0']}>
        <Text
          fontSize={['49px', '49px', '59px']}
          letterSpacing={'-0.49px'}
          lineHeight="1.2"
          fontWeight="bold"
          bgClip="text"
          width="fit-content"
          bgGradient={'linear(to-l, #ff9a9e, #fad0c4)'}
        >
          Deploy to production
        </Text>
        <Stack width={['310px', '428px', '428px']} spacing={0} pt={'36px'}>
          <CommitBox
            avatarName="obiwan-kenobi"
            commitHash="d2afe3"
            username={'owkenobi'}
            commitMessage={'better k-shot examples for lightsaber'}
            numRows={'18'}
            deploying
          />
          <CommitDeploymentView />
        </Stack>
        <chakra.span fontSize="19px" textColor="grey.500" lineHeight="1.5" pt={'36px'} pb={['108px']}>
          Glass Platform will automatically track changes to your Glass files and update your model. We handle all
          hosting, storage, and deployment. Just focus on building your app.
        </chakra.span>
      </Stack>
      <Stack pt="128px" ps={['48px', '72px', '72px']}>
        <Stack width={['293px', '630px', '630px']}>
          <Text
            fontSize={['49px', '49px', '59px']}
            letterSpacing={'-0.49px'}
            lineHeight="1.1"
            fontWeight="bold"
            bgClip="text"
            width="fit-content"
            bgGradient={'linear(to-r, #fbc2eb, #a18cd1)'}
            pb={'36px'}
          >
            Built-in playground
          </Text>
          <CommitBox
            username="lordvader"
            avatarName="lord-vader"
            commitHash="a88bc8"
            commitMessage="shifting tone of prompt to dark side"
            numRows={'8'}
          />
          <Text fontSize="19px" textColor="grey.500" lineHeight="28.5px" pt={'36px'}>
            Glass Platform creates a hosted playground for you to test your app. Test your app on any device, anywhere.
          </Text>
        </Stack>
      </Stack>
      <Stack
        spacing={'16px'}
        pb={'64px'}
        pt={'128px'}
        alignSelf="center"
        alignItems={'center'}
        width={['322px', '784px']}
      >
        <Text
          fontSize={['49px', '49px', '59px']}
          letterSpacing={'-0.49px'}
          lineHeight="1.2"
          fontWeight="bold"
          bgClip="text"
          width="fit-content"
          bgGradient={'linear(to-r, #667eea, #764ba2)'}
          textAlign="center"
        >
          Share your creation
        </Text>
        <Text fontSize="19px" textColor="grey.500" lineHeight="28.5px" textAlign="center">
          Every app on Platform is a shareable link. Show your team you nailed it.
        </Text>
      </Stack>
      <Box width={'full'} px={['4px', '0px']} height="full">
        <BrowserView />
      </Box>
    </Stack>
  )
}
