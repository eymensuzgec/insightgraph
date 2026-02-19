import clsx from 'clsx'

export function cn(...v: Array<string | undefined | false | null>) {
  return clsx(v)
}
