export type ReadingPreferences = {
  fontSize: 'sm' | 'base' | 'lg' | 'xl'
  fontFamily: 'serif' | 'sans'
  lineHeight: 'relaxed' | 'loose' | 'extra-loose'
  contentWidth: 'narrow' | 'medium' | 'wide'
  textColor: 'dark' | 'light'
  backgroundColor: 'white' | 'cream' | 'dark'
}

export type ReactionType = 'fire' | 'lightbulb' | 'heart' | 'brain'

export type Reaction = {
  type: ReactionType
  count: number
  userReacted: boolean
}

export type ArticleWithReactions = {
  articleId: string
  reactions: Record<ReactionType, Reaction>
  totalReactions: number
}

export type ReadingProgress = {
  articleId: string
  scrollPercentage: number
  lastReadAt: Date
  timeSpentSeconds: number
}
