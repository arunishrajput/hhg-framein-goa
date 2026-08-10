'use client'

import { useState } from 'react'
import { DropZone } from './DropZone'
import { FormatSwitch } from './FormatSwitch'
import { ResultPreview } from './ResultPreview'
import { BuilderIdFlow } from './BuilderIdFlow'
import { CrewFlow } from './CrewFlow'
import { useGenerator } from '@/lib/generator/useGenerator'
import { useShare } from '@/lib/share/useShare'
import type { Format } from '@/lib/render/tokens'

function PfpFlow() {
  const { state, loadFile, adjustFocal, download, caption, filename } = useGenerator()
  const { share, status: shareStatus } = useShare()

  const onShare = () => {
    if (!state.blob) return
    share(state.blob, filename, caption, { format: 'pfp' })
  }

  return (
    <DropZone status={state.status} onFile={loadFile}>
      <ResultPreview
        state={state}
        onDownload={download}
        adjustFocal={adjustFocal}
        onShare={onShare}
        shareStatus={shareStatus}
      />
    </DropZone>
  )
}

export function Generator() {
  const [format, setFormat] = useState<Format>('pfp')

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-center">
        <FormatSwitch onChange={setFormat} />
      </div>

      {/* Each format keeps its own independent state — switching tabs doesn't carry a photo
          across formats, a deliberate scope call (docs/05 P3 notes). Keying on format also
          guarantees a clean unmount (revoking object URLs, closing bitmaps) on every switch. */}
      {format === 'pfp' && <PfpFlow key="pfp" />}
      {format === 'id' && <BuilderIdFlow key="id" />}
      {format === 'crew' && <CrewFlow key="crew" />}
    </div>
  )
}
