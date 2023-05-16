import { RigFile } from './rig'

interface FileTopperProps {
  file: RigFile
}

export const FileTopper = (props: FileTopperProps) => {
  const { file } = props

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', paddingBottom: '4px' }}>
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0,0,256,254.125">
        <g transform="translate(28.0292,27.82391) scale(0.78102,0.78102)">
          <g
            fill="none"
            fill-rule="nonzero"
            stroke="#147c72"
            stroke-width="none"
            stroke-linecap="butt"
            stroke-linejoin="miter"
            stroke-miterlimit="10"
            stroke-dasharray=""
            stroke-dashoffset="0"
            font-family="none"
            font-weight="none"
            font-size="none"
            text-anchor="none"
          >
            <g transform="translate(0.93431,7.47126) scale(1.86861,1.86861)">
              <g>
                <rect x="4" y="0" width="128" height="128" rx="3" ry="0" stroke-width="24"></rect>
                <path d="M104.888,96.7676l-23,24.0004" stroke-width="8"></path>
                <path d="M129.966,51.6837l-19,21" stroke-width="8"></path>
                <path d="M29.888,60.7676l-23.00005,24" stroke-width="8"></path>
                <path d="M88.888,48.7676l-23,24" stroke-width="8"></path>
                <path d="M47.888,96.7676l-23,24.0004" stroke-width="8"></path>
                <path d="M61.888,10.7676l-16.6054,17.328" stroke-width="8"></path>
              </g>
            </g>
          </g>
        </g>
      </svg>
      <span style={{ fontSize: '14px', fontWeight: 'bold', paddingLeft: '6px' }}>
        {file.filename.split('.glass')[0]}
        <span style={{ opacity: 0.3, color: 'white', fontStyle: 'italic' }}>.glass</span>
      </span>
    </div>
  )
}