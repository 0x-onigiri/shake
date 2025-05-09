export type User = {
  id: string
  username: string
  image: string
  bio?: string
}

export type Post = {
  id: string
  author: string
  thumbnailBlobId: string
  title: string
  postBlobId: string
  createdAt: string
  metadata?: PostMetadata
}

export type PostMetadata = {
  id: string
  price: number
  reviews: string[]
}

export type ReviewReaction = 'Helpful' | 'NotHelpful'

export type ReviewAuthor = {
  name: string
  image?: string
}

export type Review = {
  id: string
  content: string
  author: ReviewAuthor
  createdAt: string
  helpfulCount: number
  notHelpfulCount: number
  isCurrentUserReview: boolean
  currentUserVote: ReviewReaction | null
}

export type SessionKeyType = {
  address: string
  packageId: string
  creationTimeMs: number
  ttlMin: number
  sessionKey: string
  personalMessageSignature?: string
}
