import type { RefObject } from 'react'

export interface Section {
  id: string
  title: string
  tag?: string
  headingRef: RefObject<HTMLElement>
  offsetRem?: number
}
