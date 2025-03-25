import { useParams, Link } from 'react-router'
import { fetchPost } from '@/lib/shake-client'
import { useSuspenseQuery } from '@tanstack/react-query'
import type { Post } from '@/types'
import { fetchUser } from '@/lib/shake-client'
import { Button } from '@/components/ui/button'

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

  if (!user) {
    return null
  }

  return (
    <div className="space-y-4 px-4 py-8">
      <h1 className="text-3xl">{post.title}</h1>
      <p>
        by
        {' '}
        <Button asChild variant="link" className="p-0">
          <Link to={`/user/${user.id}`}>
            {user.username}
          </Link>
        </Button>
      </p>
    </div>
  )
}
