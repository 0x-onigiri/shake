import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address: string, length = 4) {
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`
}

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
