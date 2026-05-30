import type { IconName } from '@/shared/ui/Icon'

export type { IconName }

export const Icons = {
  navigation: {
    home: 'Home' as IconName,
    dashboard: 'Element3' as IconName,
    menu: 'HambergerMenu' as IconName,
    close: 'CloseSquare' as IconName,
    arrowLeft: 'ArrowLeft2' as IconName,
    arrowRight: 'ArrowRight2' as IconName,
    arrowUp: 'ArrowUp2' as IconName,
    arrowDown: 'ArrowDown2' as IconName,
    settings: 'Setting2' as IconName,
    arrowTurnForward: 'Forward' as IconName,
    inbox: 'DirectInbox' as IconName,
    board: 'Kanban' as IconName,
  },
  actions: {
    edit: 'Edit' as IconName,
    delete: 'Trash' as IconName,
    save: 'TickCircle' as IconName,
    cancel: 'CloseSquare' as IconName,
    add: 'Add' as IconName,
    addCircle: 'AddCircle' as IconName,
    remove: 'Minus' as IconName,
    search: 'SearchNormal' as IconName,
    searchAlt: 'SearchNormal1' as IconName,
    filter: 'Filter' as IconName,
    settings: 'Setting' as IconName,
    refresh: 'Refresh' as IconName,
    download: 'DocumentDownload' as IconName,
    upload: 'DocumentUpload' as IconName,
    sort: 'ArrowSwapVertical' as IconName,
    archive: 'Archive' as IconName,
    unarchive: 'ArchiveTick' as IconName,
    reply: 'DirectRight' as IconName,
  },
  user: {
    user: 'User' as IconName,
    users: 'Profile2User' as IconName,
    people: 'People' as IconName,
    profile: 'Profile' as IconName,
    account: 'UserOctagon' as IconName,
    login: 'Login' as IconName,
    logout: 'Logout' as IconName,
    add: 'UserAdd' as IconName,
    remove: 'ProfileRemove' as IconName,
  },
  commerce: {
    store: 'Shop' as IconName,
    package: 'Box' as IconName,
    orders: 'ShoppingBag' as IconName,
    marketing: 'Speaker' as IconName,
    billing: 'Card' as IconName,
    wallet: 'Wallet' as IconName,
    delivery: 'TruckFast' as IconName,
  },
  communication: {
    mail: 'Sms' as IconName,
    message: 'Message' as IconName,
    notification: 'Notification' as IconName,
    chat: 'Messages' as IconName,
    help: 'MessageQuestion' as IconName,
    feedback: 'MessageText' as IconName,
  },
  status: {
    success: 'TickCircle' as IconName,
    error: 'CloseCircle' as IconName,
    warning: 'Danger' as IconName,
    info: 'InfoCircle' as IconName,
  },
  file: {
    file: 'DocumentText' as IconName,
    folder: 'Folder' as IconName,
    document: 'Document' as IconName,
    clipboard: 'ClipboardText' as IconName,
    image: 'Gallery' as IconName,
    imageAdd: 'GalleryAdd' as IconName,
  },
  ui: {
    calendar: 'Calendar' as IconName,
    calendarTick: 'CalendarTick' as IconName,
    tag: 'Tag' as IconName,
    status: 'Status' as IconName,
    flag: 'Flag' as IconName,
    clock: 'Clock' as IconName,
    eye: 'Eye' as IconName,
    eyeOff: 'EyeSlash' as IconName,
    lock: 'Lock' as IconName,
    unlock: 'Unlock' as IconName,
    star: 'Star1' as IconName,
    heart: 'Heart' as IconName,
    share: 'Share' as IconName,
    link: 'Link' as IconName,
    check: 'TickSquare' as IconName,
    sale: 'DiscountShape' as IconName,
    chevronRight: 'ArrowRight2' as IconName,
    dot: 'Record' as IconName,
    x: 'CloseSquare' as IconName,
    viewVertical: 'HambergerMenu' as IconName,
    dollarCircle: 'DollarCircle' as IconName,
    sun: 'Sun1' as IconName,
    moon: 'Moon' as IconName,
    computer: 'Monitor' as IconName,
    notification: 'Notification' as IconName,
    cart: 'ShoppingCart' as IconName,
    fire: 'Flash' as IconName,
    sparkles: 'Magicpen' as IconName,
    award: 'Award' as IconName,
    phone: 'Mobile' as IconName,
    location: 'Location' as IconName,
    truck: 'TruckFast' as IconName,
    customerService: 'Headphone' as IconName,
    securePayment: 'CardTick' as IconName,
    returnPolicy: 'Back' as IconName,
    dotsHorizontal: 'More' as IconName,
    record: 'Record' as IconName,
    openSidebar: 'SidebarLeft' as IconName,
    closeSidebar: 'SidebarRight' as IconName,
    unfold: 'ArrowDown2' as IconName,
    unfoldUp: 'ArrowUp2' as IconName,
    unfoldDown: 'ArrowDown2' as IconName,
    shield: 'ShieldTick' as IconName,
    security: 'SecuritySafe' as IconName,
    building: 'Buildings' as IconName,
    emojiSad: 'EmojiSad' as IconName,
  },
} as const

export const getIconByCategory = (
  category: keyof typeof Icons,
  name: string,
): IconName | undefined => {
  const categoryIcons = Icons[category]
  if (categoryIcons && name in categoryIcons) {
    return categoryIcons[name as keyof typeof categoryIcons]
  }
  return undefined
}

export const searchIcons = (query: string, icons: IconName[]): IconName[] => {
  const lowerQuery = query.toLowerCase()
  return icons.filter((icon) => icon.toLowerCase().includes(lowerQuery))
}

export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 48,
} as const

export type IconSize = keyof typeof iconSizes

export const getIconSize = (size: IconSize): number => {
  return iconSizes[size]
}
