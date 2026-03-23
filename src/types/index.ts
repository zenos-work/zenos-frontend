export type UserRole = 'SUPERADMIN' | 'APPROVER' | 'AUTHOR' | 'READER'

export type ArticleStatus =
  | 'DRAFT' | 'SUBMITTED' | 'APPROVED'
  | 'REJECTED' | 'PUBLISHED' | 'ARCHIVED'

export interface User {
  id:          string
  name:        string
  role:        UserRole
  created_at:  string
  avatar_url?: string
  email?:      string
  is_active?:  number
  updated_at?: string
  terms_accepted_at?: string | null
}

export interface Tag {
  id:            string
  name:          string
  slug:          string
  tag_type?:     'topic' | 'outcome'
  article_count: number
}

export interface ArticleList {
  id:                string
  title:             string
  slug:              string
  status:            ArticleStatus
  author_id:         string
  author_name?:      string
  author_avatar?:    string
  subtitle?:         string
  cover_image_url?:  string
  read_time_minutes: number
  views_count:       number
  likes_count:       number
  comments_count:    number
  is_featured:       number
  published_at?:     string
  created_at:        string
  updated_at?:       string
  last_verified_at?: string
  expires_at?:       string
  moderation_state?: string
  moderation_note?:  string
  seo_title?:        string
  seo_description?:  string
  canonical_url?:    string
  og_image_url?:     string
  seo_schema_type?:  'Article' | 'TechArticle' | 'HowTo'
  is_expired?:       boolean
  tags:              Tag[]
}

export interface ArticleDetail extends ArticleList {
  content:         string
  updated_at:      string
  rejection_note?: string
  approved_by?:    string
}

export interface Comment {
  id:             string
  article_id:     string
  author_id:      string
  content:        string
  is_deleted:     number
  created_at:     string
  updated_at:     string
  parent_id?:     string
  author_name?:   string
  author_avatar?: string
  replies:        Comment[]
}

export interface PaginatedResponse<T> {
  items:    T[]
  page:     number
  limit:    number
  has_more: boolean
  total?:   number
}

export interface FeedResponse {
  articles: ArticleList[]
  feed:     'personalised' | 'latest' | 'featured' | 'following' | 'trending'
  page:     number
  has_more: boolean
}

export interface Notification {
  id:          string
  type:        string
  message:     string
  is_read:     number
  created_at:  string
  actor_id?:   string
  article_id?: string
  comment_id?: string
}

export interface UserPrefs {
  topics:       string[]
  email_notifs: number
  theme:        'dark' | 'light' | 'system'
}

export interface AdminStats {
  total_users:        number
  total_comments:     number
  articles_by_status: { status: ArticleStatus; c: number }[]
  top_articles:       ArticleList[]
  governance?: {
    users_by_role?: { role: UserRole; c: number }[]
    moderation?: {
      pending_approvals: number
      flagged_comments: number
      hidden_comments: number
    }
    recent_activity?: {
      notifications_7d: number
      published_7d: number
      approved_7d: number
      rejected_7d: number
    }
  }
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
  has_more: boolean
}

export interface ApiError {
  error: { message: string; status: number; code: string }
}
