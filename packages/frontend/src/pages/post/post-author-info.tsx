import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AGGREGATOR } from '@/constants'

export type UserInfo = {
  username: string
  image?: string | null
}

export function PostAuthorInfo({ user }: { user: UserInfo }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src={user.image ? `${AGGREGATOR}/v1/blobs/${user.image}` : undefined} alt={user.username} />
        <AvatarFallback>{user.username}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">{user.username}</p>
      </div>
    </div>
  )
}
