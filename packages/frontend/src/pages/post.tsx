import { useParams } from 'react-router'
import { fetchPost, fetchPostContent } from '@/lib/shake-client'
import { useSuspenseQuery } from '@tanstack/react-query'
import type { Post } from '@/types'
import { fetchUser } from '@/lib/shake-client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Clock, Share2Icon } from 'lucide-react'
import { AGGREGATOR } from '@/constants'

export default function PostPage() {
  const { postId } = useParams()

  if (!postId) {
    return <div>Post IDが指定されていません</div>
  }

  return (
    <View postId={postId} />
  )
}

function View({
  postId,
}: {
  postId: string
}) {
  const { data: post } = useSuspenseQuery({
    queryKey: ['fetchPost', postId],
    queryFn: () => fetchPost(postId),
  })

  if (!post) {
    return <div>Postが見つかりません</div>
  }

  return (
    <PostDetail post={post} />
  )
}

function PostDetail({
  post,
}: {
  post: Post
}) {
  const { data: user } = useSuspenseQuery({
    queryKey: ['fetchUser', post.author],
    queryFn: () => fetchUser(post.author),
  })
  const { data: content } = useSuspenseQuery({
    queryKey: ['fetchPostContent', post.postBlobId],
    queryFn: () => fetchPostContent(post.postBlobId),
  })

  if (!user) {
    return null
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIcon className="mr-1 h-4 w-4" />
            <span>2025年3月30日</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            <span>
              5分の読み物
            </span>
          </div>
          <Badge variant="secondary" className="text-sm">
            Sui Move
          </Badge>
          <Badge variant="secondary" className="text-sm">
            スマートコントラクト
          </Badge>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold leading-tight">{post.title}</h1>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={`${AGGREGATOR}/v1/blobs/${user.image}`} alt={user.username} />
              <AvatarFallback>{user.username}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.username}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2Icon className="h-4 w-4" />
            シェアする
          </Button>
        </div>

        {/* <div className="bg-amber-100 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-amber-200 dark:bg-amber-800 border-amber-300 dark:border-amber-700"
            >
              プレミアム
            </Badge>
            <span className="font-medium">この記事は有料コンテンツです</span>
          </div>
          <Button className="bg-blue-500">Pay with 5 SUI</Button>
        </div>  */}

        {/* メイン画像 */}
        {/* <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <img src="/placeholder.svg" className="object-cover" />
        </div> */}

        {content
          && <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />}

      </div>
    </div>
  )
}
