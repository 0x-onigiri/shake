import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useSignPersonalMessage, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient, useCurrentWallet } from '@mysten/dapp-kit'
import { getAllowlistedKeyServers, SealClient, SessionKey } from '@mysten/seal'
import { Transaction } from '@mysten/sui/transactions'
import { fromHex } from '@mysten/sui/utils'
import { fetchPost } from '@/lib/shake-client'
import { useSuspenseQuery } from '@tanstack/react-query'
import type { Post } from '@/types'
import { fetchUser, purchasePost, isPurchasedPost } from '@/lib/shake-client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { AGGREGATOR, SHAKE_ONIGIRI, COINS_TYPE_LIST } from '@/constants'
import { CalendarIcon, Clock, Share2Icon, Book } from 'lucide-react'
import { getInputCoins, downloadAndDecrypt, MoveCallConstructor } from '@/lib/sui/utils'

export default function PostPage() {
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
  const currentAccount = useCurrentAccount()

  if (!post || !currentAccount) {
    return <div>Postが見つかりません</div>
  }

  return (
    <PostDetail
      post={post}
      walletAddress={currentAccount.address}
    />
  )
}

const TTL_MIN = 10

function constructMoveCall(packageId: string, postPaymentObjectId: string, postMetadataObjectId: string): MoveCallConstructor {
  return (tx: Transaction, id: string) => {
    tx.moveCall({
      target: `${packageId}::blog::seal_approve`,
      arguments: [tx.pure.vector('u8', fromHex(id)), tx.object(postPaymentObjectId), tx.object(postMetadataObjectId)],
    })
  }
}

function PostDetail({
  post,
  walletAddress,
}: {
  post: Post
  walletAddress: string
}) {
  const { data: user } = useSuspenseQuery({
    queryKey: ['fetchUser', post.author],
    queryFn: () => fetchUser(post.author),
  })
  // const { data: content } = useSuspenseQuery({
  //   queryKey: ['fetchPostContent', post.postBlobId],
  //   queryFn: () => fetchPostContent(post.postBlobId),
  // })

  const { mutate: signPersonalMessage } = useSignPersonalMessage()
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()

  const suiClient = useSuiClient()
  const sealClient = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers('testnet'),
    verifyKeyServers: false,
  })

  const [decryptedFileUrls, setDecryptedFileUrls] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [purchased, setPurchased] = useState(false)

  console.log('decryptedFileUrls', decryptedFileUrls)

  const onView = async () => {
    console.log('currentSessionKey', currentSessionKey)
    if (
      currentSessionKey
      && !currentSessionKey.isExpired()
      && currentSessionKey.getAddress() === walletAddress
    ) {
      const moveCallConstructor = constructMoveCall(SHAKE_ONIGIRI.testnet.packageId, SHAKE_ONIGIRI.testnet.postPaymentObjectId, post.metadata.id)
      downloadAndDecrypt(
        [post.postBlobId],
        currentSessionKey,
        suiClient,
        sealClient,
        moveCallConstructor,
        setError,
        setDecryptedFileUrls,
        setReloadKey,
      )
      return
    }

    setCurrentSessionKey(null)

    console.log(walletAddress, SHAKE_ONIGIRI.testnet.packageId, TTL_MIN)

    const sessionKey = new SessionKey({
      address: walletAddress,
      packageId: SHAKE_ONIGIRI.testnet.packageId,
      ttlMin: TTL_MIN,
    })

    try {
      await signPersonalMessage(
        {
          message: sessionKey.getPersonalMessage(),
        },
        {
          onSuccess: async (result) => {
            console.log('result', result)
            await sessionKey.setPersonalMessageSignature(result.signature)
            const moveCallConstructor = await constructMoveCall(SHAKE_ONIGIRI.testnet.packageId, SHAKE_ONIGIRI.testnet.postPaymentObjectId, post.metadata.id)
            await downloadAndDecrypt(
              [post.postBlobId],
              sessionKey,
              suiClient,
              sealClient,
              moveCallConstructor,
              setError,
              setDecryptedFileUrls,
              setReloadKey,
            )
            setCurrentSessionKey(sessionKey)
          },
          onError: (error) => {
            console.error('Error signing message:', error)
          },

        },
      )
    }
    catch (error: any) {
      console.error('Error:', error)
    }
  }

  const purchase = async () => {
    const tx = new Transaction()
    const [suiCoin] = await getInputCoins(
      tx,
      suiClient,
      walletAddress,
      COINS_TYPE_LIST.SUI,
      post.metadata.price,
    )

    purchasePost(tx, post.metadata.id, suiCoin)

    signAndExecuteTransaction(
      {
        transaction: tx,
        chain: 'sui:testnet',
      },
      {
        onSuccess: (result) => {
          console.log('executed transaction', result)
        },
        onError: (error) => {
          console.error('error', error)
        },
      },
    )
  }

  const isPurchased = async () => {
    const tx = new Transaction()
    isPurchasedPost(tx, post.metadata.id)
    const res = await suiClient.devInspectTransactionBlock({
      sender: walletAddress,
      transactionBlock: tx,
    })

    const result = res.results[0].returnValues[0][0][0]
    setPurchased(result === 1)
  }

  useEffect(() => {
    isPurchased()
  }, [])

  if (!user) {
    return null
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIcon className="mr-1 h-4 w-4" />
            <span>2025年3月30日</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            <span>
              5分の読み物
            </span>
          </div>
          <Badge variant="secondary" className="text-sm">
            Sui Move
          </Badge>
          <Badge variant="secondary" className="text-sm">
            スマートコントラクト
          </Badge>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold leading-tight">{post.title}</h1>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={`${AGGREGATOR}/v1/blobs/${user.image}`} alt={user.username} />
              <AvatarFallback>{user.username}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {purchased && decryptedFileUrls.length === 0
              && (
                <Button variant="secondary" size="sm" className="gap-2" onClick={onView}>
                  <Book className="h-4 w-4" />
                  署名して読む
                </Button>
              )}
            {post.metadata.price > 0 && !purchased
              && (
                <Button size="sm" className="gap-2" onClick={purchase}>
                  購入
                  {' '}
                  {post.metadata.price / 1000000000}
                  {' '}
                  SUI
                </Button>
              )}
          </div>
        </div>

        {/* <div className="bg-amber-100 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-amber-200 dark:bg-amber-800 border-amber-300 dark:border-amber-700"
            >
              プレミアム
            </Badge>
            <span className="font-medium">この記事は有料コンテンツです</span>
          </div>
          <Button className="bg-blue-500">Pay with 5 SUI</Button>
        </div>  */}

        {/* メイン画像 */}
        {/* <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <img src="/placeholder.svg" className="object-cover" />
        </div> */}

        {decryptedFileUrls && decryptedFileUrls.length > 0 && <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: decryptedFileUrls[0] }} />}

      </div>
    </div>
  )
}
