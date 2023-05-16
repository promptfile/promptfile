import { RigFile } from './rig'

interface FileTopperProps {
  file: RigFile
}

export const FileTopper = (props: FileTopperProps) => {
  const { file } = props

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', paddingBottom: '4px' }}>
      <svg width="20" height="20" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        <mask id="path-1-inside-1_18_47" fill="white">
          <rect width="128" height="128" rx="3" />
        </mask>
        <rect width="128" height="128" rx="3" stroke="#5B8A72" stroke-width="20" mask="url(#path-1-inside-1_18_47)" />
        <path d="M80.1388 95.7545L57.7857 118.493" stroke="#5B8A72" stroke-width="10" stroke-linecap="round" />
        <path d="M121 49L104.022 66.2713" stroke="#5B8A72" stroke-width="10" stroke-linecap="round" />
        <path d="M24.1778 53.9711L8.02952 70.4" stroke="#5B8A72" stroke-width="10" stroke-linecap="round" />
        <line
          x1="73.997"
          y1="48.6033"
          x2="60.0343"
          y2="62.807"
          stroke="#5B8A72"
          stroke-width="10"
          stroke-linecap="round"
        />
        <path d="M37.9325 85.5239L7.92683 116.047" stroke="#5B8A72" stroke-width="10" stroke-linecap="round" />
        <path d="M46.9333 8.53333L31.791 23.9369" stroke="#5B8A72" stroke-width="10" stroke-linecap="round" />
      </svg>
      <span style={{ fontSize: '14px', fontWeight: 'bold', paddingLeft: '6px' }}>
        {file.filename.split('.glass')[0]}
        <span style={{ opacity: 0.3, color: 'white', fontStyle: 'italic' }}>.glass</span>
      </span>
    </div>
  )
}
