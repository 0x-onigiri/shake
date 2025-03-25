import { useState, Suspense } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { fetchUser, fetchUserPosts } from '@/lib/shake-client'
import { Card,
  CardContent } from '@/components/ui/card'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import { PostCard } from '@/components/post-card'
import { createPost } from '@/lib/shake-client'
import type { User } from '@/types'

export default function Cook() {
  const currentAccount = useCurrentAccount()

  if (!currentAccount) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Suspense fallback={<div>Loading...</div>}>
        <View walletAddress={currentAccount.address} />
      </Suspense>
    </div>
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
    return null
  }

  return (
    <div className="space-y-4">
      <Suspense fallback={<div>Loading Posts...</div>}>
        <ErrorBoundary fallback={<div>On no!</div>}>
          <UserPosts userId={user.id} />
        </ErrorBoundary>
      </Suspense>

      <CreatePost user={user} />
    </div>
  )
}

function CreatePost({
  user,
}: {
  user: User
}) {
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  const navigate = useNavigate()
  const [title, setTitle] = useState<string>('')
  const [_, setDigest] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    if (!user) return
    e.preventDefault()

    if (!title.trim()) {
      alert('タイトルを入力してください')
      return
    }

    const tx = await createPost(user.id, title)

    signAndExecuteTransaction(
      {
        transaction: tx,
        chain: 'sui:testnet',
      },
      {
        onSuccess: (result) => {
          console.log('executed transaction', result)
          setDigest(result.digest)
          // window.open(`https://testnet.suivision.xyz/txblock/${result.digest}?tab=Events`, '_blank', 'noopener,noreferrer')
          navigate('/')
        },
        onError: (error) => {
          console.error('error', error)
        },
      },
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        New Shake
      </h1>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="タイトルを入力"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              onClick={handleSubmit}
            >
              Create
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function UserPosts({
  userId,
}: {
  userId: string
}) {
  const { data: posts } = useSuspenseQuery({
    queryKey: ['fetchUserPosts', userId],
    queryFn: () => fetchUserPosts(userId),
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
