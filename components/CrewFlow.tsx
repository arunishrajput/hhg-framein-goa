'use client'

import { CrewResult } from './CrewResult'
import { useCrewGenerator } from '@/lib/generator/useCrewGenerator'
import { useShare } from '@/lib/share/useShare'

export function CrewFlow() {
  const generator = useCrewGenerator()
  const { share, status: shareStatus } = useShare()

  const onShare = () => {
    if (!generator.blob) return
    share(generator.blob, generator.filename, generator.caption, {
      format: 'crew',
      name: generator.teamName.trim() || undefined,
    })
  }

  return <CrewResult generator={generator} onShare={onShare} shareStatus={shareStatus} />
}
