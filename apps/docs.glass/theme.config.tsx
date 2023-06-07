import ThemeToggle from '@/components/ThemeToggle/ThemeToggle'
import { useRouter } from 'next/router'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  useNextSeoProps() {
    const { asPath } = useRouter()
    if (asPath !== '/') {
      return {
        titleTemplate: '%s – Glass',
        description: 'Glass | %s',
      }
    }
    return {
      titleTemplate: 'Glass: docs',
      description: 'Glass is a declarative framework for building applications using large language models (LLMs).',
    }
  },
  logo: (
    <>
      <svg width="88" height="15" viewBox="0 0 88 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M30.8347 14.7507H33.6269V7.00138H28.3551V9.2036H30.8347V10.2632C30.8347 11.5512 30.1263 12.4861 28.7302 12.4861C26.9174 12.4861 26.3131 10.9488 26.3131 8.60111V6.23269C26.3131 3.90582 26.8965 2.51385 28.4802 2.51385C29.9179 2.51385 30.3972 3.65651 30.7097 4.88227L33.6269 4.1759C33.0435 1.68283 31.5432 0 28.5427 0C24.7712 0 23 2.70083 23 7.62465C23 12.2368 24.5419 15 27.3966 15C29.1886 15 30.168 13.8989 30.6472 12.6939H30.8347V14.7507Z"
          fill="#3D53F5"
        />
        <path d="M47.1213 14.7507V12.1953H40.8702V0.249329H37.7238V14.7507H47.1213Z" fill="#3D53F5" />
        <path
          d="M61.7407 14.7507L57.8025 0.249329H53.385L49.4468 14.7507H52.6141L53.5101 11.2604H57.4899L58.4068 14.7507H61.7407ZM57.0107 8.74656H54.0101L55.4271 3.26179H55.5938L57.0107 8.74656Z"
          fill="#3D53F5"
        />
        <path
          d="M68.9006 15C72.5471 15 74.4641 13.0055 74.4641 10.2839C74.4641 7.99861 73.1097 6.62742 70.776 6.21191L69.2549 5.94183C67.8379 5.69252 67.2545 5.25623 67.2545 4.259C67.2545 3.11634 67.963 2.53463 69.359 2.53463C70.6718 2.53463 71.7553 3.05402 72.5263 3.90582L74.2974 1.93213C73.2764 0.747923 71.5678 0 69.3382 0C66.0459 0 64.1081 1.6205 64.1081 4.40443C64.1081 6.52355 65.2125 8.12327 67.8171 8.55956L69.3382 8.80886C70.7551 9.0374 71.2969 9.51524 71.2969 10.5332C71.2969 11.7798 70.4842 12.4654 69.0048 12.4654C67.7129 12.4654 66.4002 11.9252 65.3375 10.7618L63.5247 12.7562C64.629 14.1274 66.4835 15 68.9006 15Z"
          fill="#3D53F5"
        />
        <path
          d="M82.4365 15C86.083 15 88 13.0055 88 10.2839C88 7.99861 86.6456 6.62742 84.3118 6.21191L82.7907 5.94183C81.3738 5.69252 80.7904 5.25623 80.7904 4.259C80.7904 3.11634 81.4988 2.53463 82.8949 2.53463C84.2076 2.53463 85.2912 3.05402 86.0621 3.90582L87.8333 1.93213C86.8123 0.747923 85.1036 0 82.8741 0C79.5818 0 77.644 1.6205 77.644 4.40443C77.644 6.52355 78.7483 8.12327 81.353 8.55956L82.8741 8.80886C84.291 9.0374 84.8328 9.51524 84.8328 10.5332C84.8328 11.7798 84.0201 12.4654 82.5407 12.4654C81.2488 12.4654 79.936 11.9252 78.8734 10.7618L77.0605 12.7562C78.1649 14.1274 80.0194 15 82.4365 15Z"
          fill="#3D53F5"
        />
        <mask id="path-6-inside-1_25_9" fill="white">
          <rect x="2" width="15" height="15" rx="1" />
        </mask>
        <rect x="2" width="15" height="15" rx="1" stroke="#4257F6" stroke-width="4" mask="url(#path-6-inside-1_25_9)" />
        <path d="M11.3911 11.2213L8.77161 13.8859" stroke="#4257F6" stroke-width="2" stroke-linecap="round" />
        <path d="M15.9897 6L14.0001 8.02398" stroke="#4257F6" stroke-width="2" stroke-linecap="round" />
        <path d="M4.89233 6L2.99996 7.92526" stroke="#4257F6" stroke-width="2" stroke-linecap="round" />
        <line
          x1="10.6764"
          y1="6.28123"
          x2="9.62068"
          y2="7.35516"
          stroke="#4257F6"
          stroke-width="2"
          stroke-linecap="round"
        />
        <path d="M6.51636 10L3.00007 13.577" stroke="#4257F6" stroke-width="2" stroke-linecap="round" />
        <path d="M7.5 1L5.72551 2.80511" stroke="#4257F6" stroke-width="2" stroke-linecap="round" />
      </svg>
    </>
  ),
  project: {
    link: 'https://github.com/glass-lang/glass',
  },
  chat: {
    link: 'https://discord.com/invite/H64PFP2DCc',
  },
  docsRepositoryBase: 'https://github.com/glass-lang/glass/tree/main/apps/docs',
  // footer: {
  //   text: '© 2023 Glass. All rights reserved.',
  // },
  footer: {
    component: () => <div />,
  },
  feedback: {
    useLink: () =>
      `https://github.com/glass-lang/glass/issues/new?title=Feedback%20for%20%E2%80%9CGlass%E2%80%9D&labels=feedback`,
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
