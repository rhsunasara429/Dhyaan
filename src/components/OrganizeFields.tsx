import { useState } from 'react'
import { addDaysLocal, todayLocal } from '../dates.ts'
import { AREAS } from '../tasks.ts'
import type { Area } from '../types.ts'

type OrganizeFieldsProps = {
  area: Area | null
  dueDate: string | null
  onAreaChange: (area: Area | null) => void
  onDueDateChange: (dueDate: string | null) => void
}

function areaLabel(area: Area): string {
  return area.charAt(0).toUpperCase() + area.slice(1)
}

export function OrganizeFields({
  area,
  dueDate,
  onAreaChange,
  onDueDateChange,
}: OrganizeFieldsProps) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        className="sheet-more"
        aria-expanded={false}
        onClick={() => setOpen(true)}
      >
        Add details
      </button>
    )
  }

  const today = todayLocal()

  return (
    <div className="sheet-more-open">
      <button
        type="button"
        className="sheet-more"
        aria-expanded={true}
        onClick={() => setOpen(false)}
      >
        Hide details
      </button>
      <div
        className="sheet-chips"
        role="group"
        aria-label="Area"
      >
        {AREAS.map((option) => (
          <button
            key={option}
            type="button"
            className={
              area === option ? 'sheet-chip sheet-chip-active' : 'sheet-chip'
            }
            aria-pressed={area === option}
            onClick={() => onAreaChange(area === option ? null : option)}
          >
            {areaLabel(option)}
          </button>
        ))}
      </div>
      <div className="sheet-due-row">
        <input
          className="sheet-date"
          type="date"
          aria-label="Due date"
          value={dueDate ?? ''}
          onChange={(event) =>
            onDueDateChange(
              event.target.value === '' ? null : event.target.value,
            )
          }
        />
        <button
          type="button"
          className="sheet-due-shortcut"
          onClick={() => onDueDateChange(today)}
        >
          Today
        </button>
        <button
          type="button"
          className="sheet-due-shortcut"
          onClick={() => onDueDateChange(addDaysLocal(today, 1))}
        >
          Tomorrow
        </button>
        <button
          type="button"
          className="sheet-due-shortcut"
          onClick={() => onDueDateChange(null)}
        >
          Clear
        </button>
      </div>
    </div>
  )
}
