import { useState, Suspense } from 'react'
import { useNavigate } from 'react-router'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { fetchUser } from '@/lib/shake-client'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createPost } from '@/lib/shake-client'
import type { User } from '@/types'
import { SHAKE_ONIGIRI } from '@/constants'
import { Editor } from '@/components/posts/editor'

export default function CookPage() {
  const currentAccount = useCurrentAccount()

  if (!currentAccount) {
    return null
  }

  return (
    <div>
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
  const [pending, setPending] = useState(false)

  const handleSave = async (title: string, content: string) => {
    if (!user) return

    // TODO: ZOD
    if (!title.trim()) {
      alert('タイトルを入力してください')
      return
    }

    if (!content.trim()) {
      alert('本文を入力してください')
      return
    }

    try {
      setPending(true)
      const tx = await createPost(user.id, title, content)

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
      <Editor onSave={handleSave} pending={pending} />

    </div>
  )
}
