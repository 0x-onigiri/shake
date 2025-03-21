import { useState, use, Suspense } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { SHAKE_ONIGIRI } from '@/constants'
import { UserModule } from '@/lib/sui/user-functions'
import { truncateAddress } from '@/lib/utils'
import { fetchUser, fetchUserPosts } from '@/lib/shake-client'
import { Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent } from '@/components/ui/card'

export default function Cook() {
  const currentAccount = useCurrentAccount()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {currentAccount && (
        <Suspense fallback={<div>Loading...</div>}>
          <View promise={fetchUser(currentAccount.address)} />
        </Suspense>
      )}
    </div>
  )
}

function View({
  promise,
}: {
  promise: Promise<any>
}) {
  const user = use(promise)

  if (!user) {
    return <CreateUser />
  }

  return (
    <>
      <Suspense fallback={<div>Loading Posts...</div>}>
        <UserPosts promise={fetchUserPosts(user.id)} />
      </Suspense>

      <CreatePost user={user} />
    </>
  )
}

function CreateUser() {
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()

  async function create() {
    const tx = new Transaction()

    const [userActivity] = UserModule.create_new_user(
      tx,
      SHAKE_ONIGIRI.testnet.packageId,
      SHAKE_ONIGIRI.testnet.userListObjectId,
      'test-user',
    )
    UserModule.delete_user_activity(tx, SHAKE_ONIGIRI.testnet.packageId, userActivity)

    signAndExecuteTransaction(
      {
        transaction: tx,
        chain: 'sui:testnet',
      },
      {
        onSuccess: (result) => {
          console.log('executed createNewUser transaction', result)
          window.location.reload()
        },
        onError: (error) => {
          console.error('createNewUser error', error)
        },
      },
    )
  }

  return (
    <Button onClick={create}>
      Create User
    </Button>
  )
}

function CreatePost({
  user,
}: {
  user: any
}) {
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  const navigate = useNavigate()
  const [title, setTitle] = useState<string>('')
  const [_, setDigest] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    if (!user) return
    console.log('handleSubmit', user)
    e.preventDefault()

    if (!title.trim()) {
      alert('タイトルを入力してください')
      return
    }

    const tx = new Transaction()
    const [userActivity1] = UserModule.existing_user_activity(
      tx, SHAKE_ONIGIRI.testnet.packageId, user.id)
    const [userActivity2] = tx.moveCall({
      target: `${SHAKE_ONIGIRI.testnet.packageId}::blog::create_post`,
      arguments: [userActivity1, tx.pure.string(title), tx.object('0x6')],
    })
    UserModule.delete_user_activity(tx, SHAKE_ONIGIRI.testnet.packageId, userActivity2)

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
  promise,
}: {
  promise: Promise<any>
}) {
  const posts = use(promise)

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Your Posts
      </h1>
      <ul className="grid grid-cols-3 gap-4">
        {
          posts.map((post: any) => {
            return (
              <Card key={post.id}>
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  <CardDescription>記事本文記事本文記事本文記事本文</CardDescription>
                </CardHeader>
                <CardFooter>
                  <p>
                    by
                    {' '}
                    {truncateAddress(post.author)}
                  </p>
                </CardFooter>
              </Card>
            )
          })
        }
      </ul>
    </div>
  )
}
