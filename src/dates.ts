function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function formatLocal(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Local-day key (YYYY-MM-DD) for an epoch timestamp, matching todayLocal(). */
export function dayKeyFromTimestamp(timestamp: number): string {
  return formatLocal(new Date(timestamp))
}

export function todayLocal(now: Date = new Date()): string {
  return formatLocal(now)
}

export function addDaysLocal(dateString: string, days: number): string {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return formatLocal(date)
}

/** Human-readable form of a day key for display headers, e.g. "Monday, January 1". */
export function formatLongDate(day: string, locale: string = 'en-US'): string {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(year, month - 1, date).toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}
