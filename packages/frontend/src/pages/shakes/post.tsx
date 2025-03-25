import { useParams } from 'react-router'
import { fetchPost } from '@/lib/shake-client'
import { useSuspenseQuery } from '@tanstack/react-query'

export default function Post() {
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
    <div className="space-y-4 px-4 py-8">
      <h1 className="text-3xl">{post.title}</h1>
      <p>
        by
        {post.author}
      </p>
    </div>
  )
}
