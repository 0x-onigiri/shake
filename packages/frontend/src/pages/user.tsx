import { Suspense } from 'react'
import { useParams } from 'react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { AGGREGATOR } from '@/constants'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { fetchUser, fetchUserPosts } from '@/lib/shake-client'
import { ErrorBoundary } from 'react-error-boundary'
import { PostCard } from '@/components/posts/post-card'

export default function UserPage() {
  const { walletAddress } = useParams()

  if (!walletAddress) {
    return <div>Wallet Addressが指定されていません</div>
  }

  return (
    <View walletAddress={walletAddress} />
  )
}

function View({
  walletAddress,
}: {
  walletAddress: string
}) {
  const { data: user } = useSuspenseQuery({
    queryKey: ['fetchUser', walletAddress],
    queryFn: () => fetchUser(walletAddress),
  })

  if (!user) {
    return <div>Userが見つかりません</div>
  }

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-8">
      <Avatar className="size-24">
        <AvatarImage className="object-cover" src={`${AGGREGATOR}/v1/blobs/${user.image}`} alt={user.username} />
        <AvatarFallback>💧</AvatarFallback>
      </Avatar>
      <h1 className="text-3xl">{user.username}</h1>
      {user.bio && (
        <div className="max-w-md w-full bg-gray-50 rounded-lg border border-gray-100 p-4 shadow-sm mt-2">
          <p style={{ whiteSpace: 'pre-wrap' }} className="text-gray-700 text-start leading-relaxed">{user.bio}</p>
        </div>
      )}
      <Suspense fallback={<div>Loading Posts...</div>}>
        <ErrorBoundary fallback={<div>On no!</div>}>
          <UserPosts walletAddress={walletAddress} />
        </ErrorBoundary>
      </Suspense>
    </div>
  )
}

function UserPosts({
  walletAddress,
}: {
  walletAddress: string
}) {
  const { data: posts } = useSuspenseQuery({
    queryKey: ['fetchUserPosts', walletAddress],
    queryFn: () => fetchUserPosts(walletAddress),
  })

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Your Posts
      </h1>
      <ul className="grid grid-cols-3 gap-4">
        {
          posts.map((post) => {
            return (
              <li key={post.id}>
                <PostCard post={post} />
              </li>
            )
          })
        }
      </ul>
    </div>
  )
}
