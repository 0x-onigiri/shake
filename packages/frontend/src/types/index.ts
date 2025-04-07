export type User = {
  id: string
  username: string
  image: string
  bio?: string
}

export type Post = {
  id: string
  author: string
  title: string
  postBlobId: string
  metadata?: PostMetadata
}

export type PostMetadata = {
  id: string
  price: number
}
