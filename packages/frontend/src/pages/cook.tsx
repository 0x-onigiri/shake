import { useState, Suspense } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { fetchUser, fetchUserPosts } from '@/lib/shake-client'
import { Card,
  CardContent } from '@/components/ui/card'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import { PostCard } from '@/components/posts/post-card'
import { createPost } from '@/lib/shake-client'
import type { User } from '@/types'
import { SHAKE_ONIGIRI } from '@/constants'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

export default function CookPage() {
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
          <UserPosts walletAddress={walletAddress} />
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
  const client = useSuiClient()
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          // Raw effects are required so the effects can be reported back to the wallet
          showRawEffects: true,
          // Select additional data to return
          showObjectChanges: true,
          showEffects: true,
        },
      }),
  })
  const navigate = useNavigate()
  const [title, setTitle] = useState<string>('')
  const [content, setContent] = useState<string>('')
  const [images, setImages] = useState<{ name: string, data: string }[]>([])
  const [pending, setPending] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setImages(prev => [...prev, { name: file.name, data: base64 }])
      const imagePlaceholder = `[画像: ${file.name}]`
      setContent(prev => prev + '\n' + imagePlaceholder)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    if (!user) return
    e.preventDefault()

    if (!title.trim()) {
      alert('タイトルを入力してください')
      return
    }

    if (!content.trim()) {
      alert('本文を入力してください')
      return
    }

    let finalContent = content
    images.forEach((image) => {
      finalContent = finalContent.replace(`[画像: ${image.name}]`, image.data)
    })

    try {
      setPending(true)
      const tx = await createPost(user.id, title, finalContent)

      signAndExecuteTransaction(
        {
          transaction: tx,
          chain: 'sui:testnet',
        },
        {
          onSuccess: (result) => {
            console.log('executed transaction', result)
            const postId = result.objectChanges?.find(change =>
              change.type === 'created'
              && change.objectType === `${SHAKE_ONIGIRI.testnet.packageId}::blog::Post`,
            )?.objectId
            setPending(false)
            navigate(`/${postId}`)
          },
          onError: (error) => {
            console.error('error', error)
          },
        },
      )
    }
    catch (error) {
      console.error('error', error)
    }
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

            <div className="space-y-2">
              <Label htmlFor="content">本文</Label>
              <Textarea
                id="content"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="本文を入力"
                className="h-[400px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">画像をアップロード</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image.data}
                        alt={image.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImages(prev => prev.filter((_, i) => i !== index))
                          setContent(prev => prev.replace(`[画像: ${image.name}]`, ''))
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              onClick={handleSubmit}
              disabled={pending}
            >
              {pending
                ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  )
                : (
                    'Create'
                  )}
            </Button>
          </form>
        </CardContent>
      </Card>
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
