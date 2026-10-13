import { useState } from 'react'
import { addDaysLocal, todayLocal } from '../lib/dates.ts'
import { AREAS, REPEATS } from '../lib/tasks.ts'
import type { Area, Repeat } from '../lib/types.ts'

type OrganizeFieldsProps = {
  area: Area | null
  dueDate: string | null
  repeat: Repeat | null
  onAreaChange: (area: Area | null) => void
  onDueDateChange: (dueDate: string | null) => void
  onRepeatChange: (repeat: Repeat | null) => void
}

function areaLabel(area: Area): string {
  return area.charAt(0).toUpperCase() + area.slice(1)
}

function repeatLabel(repeat: Repeat): string {
  return repeat === 'daily' ? 'Daily' : 'Weekly'
}

export function OrganizeFields({
  area,
  dueDate,
  repeat,
  onAreaChange,
  onDueDateChange,
  onRepeatChange,
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

  function handleRepeatChange(next: Repeat | null) {
    onRepeatChange(next)
    // A repeating task needs a date to ever reach Today. Default an undated
    // repeat to today immediately so the user sees where it will land.
    if (next !== null && dueDate === null) {
      onDueDateChange(today)
    }
  }

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
      <p className="sheet-section-label" id="repeat-label">
        Repeats
      </p>
      <div
        className="sheet-chips"
        role="group"
        aria-labelledby="repeat-label"
      >
        <button
          type="button"
          className={
            repeat === null ? 'sheet-chip sheet-chip-active' : 'sheet-chip'
          }
          aria-pressed={repeat === null}
          onClick={() => handleRepeatChange(null)}
        >
          Off
        </button>
        {REPEATS.map((option) => (
          <button
            key={option}
            type="button"
            className={
              repeat === option ? 'sheet-chip sheet-chip-active' : 'sheet-chip'
            }
            aria-pressed={repeat === option}
            onClick={() =>
              handleRepeatChange(repeat === option ? null : option)
            }
          >
            {repeatLabel(option)}
          </button>
        ))}
      </div>
      {repeat !== null ? (
        <p className="sheet-hint">
          {repeat === 'daily'
            ? 'Completing it creates tomorrow’s task. History stays done.'
            : 'Completing it creates next week’s task on the same weekday.'}
        </p>
      ) : null}
    </div>
  )
}
