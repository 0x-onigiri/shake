import { Link } from 'react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchUser } from '@/lib/shake-client'
import type { Post } from '@/types'
import { truncateAddress } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle } from '@/components/ui/card'

type Props = {
  post: Post
}

export function PostCard({
  post,
}: Props) {
  const { data: user } = useSuspenseQuery({
    queryKey: ['fetchUser', post.author],
    queryFn: () => fetchUser(post.author),
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle>{post.title}</CardTitle>
        <CardDescription>記事本文記事本文記事本文記事本文</CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-col gap-2">
        <p>
          by
          {' '}
          {user?.username || truncateAddress(post.author)}
        </p>
        <Button asChild size="sm">
          <Link to={`/${post.id}`}>
            View More
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
