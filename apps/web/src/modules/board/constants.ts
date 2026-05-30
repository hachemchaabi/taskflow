import type { Priority } from '@/shared/types'

export const EDIT_DIALOG = {
  title: 'Edit list',
  description: 'Update this list’s name and icon.',
  nameLabel: 'List name',
  iconLabel: 'Icon',
  iconHint: 'PNG, JPG or SVG, up to 2MB.',
  upload: 'Upload',
  replace: 'Replace',
  remove: 'Remove',
  submit: 'Save changes',
} as const

export const BOARD_ICON_MAX_BYTES = 2 * 1024 * 1024
export const BOARD_ICON_MIME = ['image/png', 'image/jpeg', 'image/svg+xml']

export const BOARD_ICON_MESSAGES = {
  error: 'Could not upload the icon.',
  typeError: 'Icon must be a PNG, JPG or SVG image.',
  sizeError: 'Icon must be 2MB or smaller.',
} as const

export const DELETE_DIALOG = {
  title: 'Delete list',
  body: (name: string) =>
    `“${name}” and everything in it will be permanently deleted. This can’t be undone.`,
  confirm: 'Delete list',
  cancel: 'Cancel',
} as const

export const CARD_META = {
  noDueDate: 'No due date',
  unassigned: 'Unassigned',
  noLabels: 'No labels',
} as const

interface PriorityMeta {
  label: string
  name: string
  iconClass: string
}

export const PRIORITY_ORDER: Priority[] = ['HIGH', 'MEDIUM', 'LOW', 'NONE']

export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  HIGH: {
    label: 'High',
    name: 'High priority',
    iconClass: 'text-destructive',
  },
  MEDIUM: {
    label: 'Medium',
    name: 'Medium priority',
    iconClass: 'text-primary',
  },
  LOW: { label: 'Low', name: 'Low priority', iconClass: 'text-success' },
  NONE: {
    label: 'None',
    name: 'No priority',
    iconClass: 'text-muted-foreground',
  },
}

export const FILTER = {
  trigger: 'Filter',
  title: 'Filter tasks',
  searchLabel: 'Search title',
  searchPlaceholder: 'Search by title…',
  priorityHeading: 'Priority',
  labelsHeading: 'Labels',
  assigneesHeading: 'Assignees',
  noLabels: 'This board has no labels yet.',
  noMembers: 'This board has no members yet.',
  clear: 'Clear filters',
} as const

export const DELETE_TASK_DIALOG = {
  title: 'Delete task',
  body: (name: string) => `“${name}” will be permanently deleted. This can’t be undone.`,
  confirm: 'Delete task',
  cancel: 'Cancel',
} as const

export const SHARE_DIALOG = {
  title: 'Share list',
  description: 'Add workspace members to this list and manage their access.',
  empty: 'Everyone in this workspace already has access.',
  membersHeading: 'People with access',
  addHeading: 'Add from workspace',
} as const

export const BOARD_ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MEMBER', label: 'Member' },
] as const

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform)

export const SUBMIT_SHORTCUT = isMac ? '⌘ + ↵' : 'Ctrl + ↵'

export const DELETE_COMMENT_DIALOG = {
  title: 'Delete comment',
  body: 'This comment’s content will be removed and replaced with a placeholder in the thread. This can’t be undone.',
  confirm: 'Delete',
  cancel: 'Cancel',
} as const

export const COMMENT_DELETED_PLACEHOLDER = '(comment deleted)'

export const MENTION = {
  token: /@\[([a-z0-9]+)\]/g,
  query: /(?:^|\s)@(\S*)$/,
  maxSuggestions: 6,
} as const
