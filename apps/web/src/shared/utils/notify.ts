import { toastManager } from '@/shared/ui/toast'

export function notifyError(title: string, description?: string): void {
  toastManager.add({ title, description, type: 'error', priority: 'high' })
}

export function notifySuccess(title: string, description?: string): void {
  toastManager.add({ title, description, type: 'success' })
}

export function notifyInfo(title: string, description?: string, onClick?: () => void): void {
  toastManager.add({
    title,
    description,
    type: 'info',
    ...(onClick ? { data: { onClick } } : {}),
  })
}
