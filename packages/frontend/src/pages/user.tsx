import { useParams } from 'react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchUserByUserId } from '@/lib/shake-client'
import { AGGREGATOR } from '@/constants'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function UserPage() {
  const { userId } = useParams()

  if (!userId) {
    return <div>User IDが指定されていません</div>
  }

  return (
    <View userId={userId} />
  )
}

function View({
  userId,
}: {
  userId: string
}) {
  const { data: user } = useSuspenseQuery({
    queryKey: ['fetchUserByUserId', userId],
    queryFn: () => fetchUserByUserId(userId),
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
    </div>
  )
}
