import ThemeToggle from '@/components/ThemeToggle/ThemeToggle'
import { useRouter } from 'next/router'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  useNextSeoProps() {
    const { asPath } = useRouter()
    if (asPath !== '/') {
      return {
        titleTemplate: '%s – Promptfile',
        description: 'Promptfile | %s',
      }
    }
    return {
      titleTemplate: 'Promptfile',
      description:
        'Promptfile is an open-source tool designed to make the process of writing and testing prompts quick and straightforward.',
    }
  },
  logo: <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Promptfile</span>,
  project: {
    link: 'https://github.com/glass-platform/promptfile',
  },
  chat: {
    link: 'https://discord.com/invite/H64PFP2DCc',
  },
  docsRepositoryBase: 'https://github.com/glass-platform/promptfile/tree/main/apps/promptfile.org',
  // footer: {
  //   text: '© 2023 Promptfile. All rights reserved.',
  // },
  footer: {
    component: () => <div />,
  },
  feedback: {
    useLink: () => `https://github.com/glass-platform/promptfile/issues/new/choose`,
  },
  navbar: {
    extraContent: (
      <>
        <ThemeToggle />
      </>
    ),
  },
  head: (
    <>
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    </>
  ),
}

export default config
