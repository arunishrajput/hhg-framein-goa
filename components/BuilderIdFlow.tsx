'use client'

import { DropZone } from './DropZone'
import { BuilderIdResult } from './BuilderIdResult'
import { useBuilderIdGenerator } from '@/lib/generator/useBuilderIdGenerator'
import { useShare } from '@/lib/share/useShare'

export function BuilderIdFlow() {
  const generator = useBuilderIdGenerator()
  const { share, status: shareStatus } = useShare()

  const onShare = () => {
    if (!generator.blob) return
    share(generator.blob, generator.filename, generator.caption, {
      format: 'id',
      name: generator.name.trim() || undefined,
    })
  }

  return (
    <DropZone status={generator.photoStatus} onFile={generator.loadFile}>
      <BuilderIdResult generator={generator} onShare={onShare} shareStatus={shareStatus} />
    </DropZone>
  )
}
