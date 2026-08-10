'use client'

import { CrewResult } from './CrewResult'
import { useCrewGenerator } from '@/lib/generator/useCrewGenerator'

export function CrewFlow() {
  const generator = useCrewGenerator()
  return <CrewResult generator={generator} />
}
