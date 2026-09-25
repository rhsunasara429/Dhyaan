function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function formatLocal(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
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
