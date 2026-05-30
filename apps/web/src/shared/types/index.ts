export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
}

export interface Label {
  id: string
  name: string
  color: string
}

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'

export interface Card {
  id: string
  title: string
  description?: string | null
  position: number
  priority: Priority
  startDate?: string | null
  endDate?: string | null
  assignees: Pick<User, 'id' | 'name' | 'avatarUrl'>[]
  labels: Label[]
  _count?: { comments: number }
}

export interface CommentMention {
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>
}

export interface Comment {
  id: string
  body: string
  createdAt: string
  parentId?: string | null
  editedAt?: string | null
  deletedAt?: string | null
  author: Pick<User, 'id' | 'name' | 'avatarUrl'>
  mentions: CommentMention[]
}

export interface CardActivity {
  id: string
  action: string
  createdAt: string
  user: Pick<User, 'id' | 'name'>
}

export interface CardDetail extends Card {
  listId: string
  comments: Comment[]
  activities: CardActivity[]
}

export interface List {
  id: string
  title: string
  position: number
  cards: Card[]
}

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER'
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'
export type Visibility = 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'
export type Locale = 'en' | 'fr' | 'ar'

export interface WorkspaceMember {
  id: string
  userId: string
  role: MemberRole
  createdAt: string
  user: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>
}

export interface BoardMember {
  id: string
  userId: string
  role: MemberRole
  user: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>
}

export interface BoardSummary {
  id: string
  title: string
  iconUrl?: string | null
  owner: Pick<User, 'id' | 'name' | 'email'>
  role: MemberRole
  _count: { members: number; lists: number }
}

export interface BoardDetail extends Omit<BoardSummary, '_count'> {
  labels: Label[]
  members: BoardMember[]
  lists: List[]
}

export interface WorkspaceSummary {
  id: string
  name: string
  slug: string
  description?: string | null
  logoUrl?: string | null
  locale: Locale
  visibility: Visibility
  defaultMemberRole: MemberRole
  role: MemberRole
  _count: { members: number; boards: number }
}

export interface WorkspaceDetail extends WorkspaceSummary {
  members: WorkspaceMember[]
}

export interface WorkspaceInvite {
  id: string
  email: string
  role: MemberRole
  status: InviteStatus
  createdAt: string
  workspace: Pick<WorkspaceSummary, 'id' | 'name'>
  invitedBy: Pick<User, 'id' | 'name'>
}
