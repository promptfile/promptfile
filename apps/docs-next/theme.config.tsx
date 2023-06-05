import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span>Glass Docs</span>,
  project: {
    link: 'https://github.com/foundation-ui/glass',
  },
  chat: {
    link: 'https://discord.gg/Bq67MZF3uT',
  },
  docsRepositoryBase: 'https://github.com/foundation-ui/glass/apps/docs-next',
  footer: {
    text: 'Glass Documentation',
  },
  feedback: {
    useLink: () =>
      `https://github.com/foundation-ui/glass/issues/new?title=Feedback%20for%20%E2%80%9CGlass%E2%80%9D&labels=feedback`,
  },
}

export default config
