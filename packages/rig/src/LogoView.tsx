interface LogoViewProps {
  dimension: string
}

export const LogoView = (props: LogoViewProps) => {
  const { dimension } = props

  return (
    <svg width={dimension} height={dimension} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <mask id="path-1-inside-1_18_47" fill="white">
        <rect width="128" height="128" rx="3" />
      </mask>
      <rect width="128" height="128" rx="3" stroke="#4257f6" stroke-width="20" mask="url(#path-1-inside-1_18_47)" />
      <path d="M80.1388 95.7545L57.7857 118.493" stroke="#4257f6" stroke-width="10" stroke-linecap="round" />
      <path d="M121 49L104.022 66.2713" stroke="#4257f6" stroke-width="10" stroke-linecap="round" />
      <path d="M24.1778 53.9711L8.02952 70.4" stroke="#4257f6" stroke-width="10" stroke-linecap="round" />
      <line
        x1="73.997"
        y1="48.6033"
        x2="60.0343"
        y2="62.807"
        stroke="#4257f6"
        stroke-width="10"
        stroke-linecap="round"
      />
      <path d="M37.9325 85.5239L7.92683 116.047" stroke="#4257f6" stroke-width="10" stroke-linecap="round" />
      <path d="M46.9333 8.53333L31.791 23.9369" stroke="#4257f6" stroke-width="10" stroke-linecap="round" />
    </svg>
  )
}
