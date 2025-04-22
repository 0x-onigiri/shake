'use client'

import { useState, Suspense } from 'react'
import { useNavigate } from 'react-router'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { getAllowlistedKeyServers, SealClient } from '@mysten/seal'
import { fromHex, toHex } from '@mysten/sui/utils'
import { fetchUser } from '@/lib/shake-client'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFreePost, createPaidPost } from '@/lib/shake-client'
import type { User } from '@/types'
import { SHAKE_ONIGIRI } from '@/constants'
import { Editor } from '@/components/posts/editor'
import { Transaction } from '@mysten/sui/transactions'
import { type PostFormData } from '@/lib/schemas'

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
  const suiClient = useSuiClient()
  const sealClient = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers('testnet'),
    verifyKeyServers: false,
  })

  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)

  const handleSave = async (formData: PostFormData) => {
    if (!user) return

    try {
      setPending(true)
      const tx = new Transaction()

      if (!formData.isPaid) {
        await createFreePost(tx, user.id, formData.title, formData.content)
      }
      else {
        const nonce = crypto.getRandomValues(new Uint8Array(5))
        const policyObjextBytes = fromHex(SHAKE_ONIGIRI.testnet.postPaymentObjectId)
        const id = toHex(new Uint8Array([...policyObjextBytes, ...nonce]))
        const dataToEncrypt = new TextEncoder().encode(formData.content)
        const { encryptedObject: encryptedBytes } = await sealClient.encrypt({
          threshold: 2,
          packageId: SHAKE_ONIGIRI.testnet.packageId,
          id,
          data: dataToEncrypt,
        })

        await createPaidPost(tx, user.id, formData.title, encryptedBytes, formData.amount * 1000000000)
      }

      const { digest } = await signAndExecuteTransaction({ transaction: tx })
      const { objectChanges } = await suiClient.waitForTransaction({
        digest,
        options: { showObjectChanges: true, showEffects: true },
      })

      const objChange = objectChanges?.find(
        change =>
          change.type === 'created' && change.objectType === `${SHAKE_ONIGIRI.testnet.packageId}::blog::Post`,
      )
      const postId = objChange && objChange.type === 'created' ? objChange.objectId : null
      if (!postId) {
        console.error('Post ID not found')
        return
      }
      navigate(`/${postId}`)
    }
    catch (error) {
      console.error('error', error)
    }
    finally {
      setPending(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">New Shake</h1>
      <Editor onSave={handleSave} pending={pending} />
    </div>
  )
}
