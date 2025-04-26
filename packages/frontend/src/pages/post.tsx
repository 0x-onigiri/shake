import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useSignPersonalMessage, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { getAllowlistedKeyServers, SealClient, SessionKey } from '@mysten/seal'
import { Transaction } from '@mysten/sui/transactions'
import { fromHex } from '@mysten/sui/utils'
import { fetchPost } from '@/lib/shake-client'
import { useSuspenseQuery } from '@tanstack/react-query'
import type { Post, ReviewReaction } from '@/types'
import { fetchUser, fetchPostContent, createReview, voteForReview, fetchPostReviews } from '@/lib/shake-client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { AGGREGATOR, SHAKE_ONIGIRI, COINS_TYPE_LIST } from '@/constants'
import { CalendarIcon, Clock, Book } from 'lucide-react'
import { getInputCoins, downloadAndDecrypt, MoveCallConstructor } from '@/lib/sui/utils'
import { BlogModule } from '@/lib/sui/blog-functions'
import { devInspectAndGetExecutionResults } from '@polymedia/suitcase-core'
import { ReviewSection } from '@/components/posts/review-section'

export default function PostPage() {
  const { postId } = useParams()

  if (!postId) {
    return <div>Post IDが指定されていません</div>
  }

  return (<View postId={postId} />)
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

  if (!post || !post.metadata) {
    return <div>Postが見つかりません</div>
  }

  if (post.metadata.price === 0) {
    return (
      <FreePostDetail post={post} />
    )
  }

  return (
    <PaidPostDetail
      post={post}
      walletAddress={currentAccount?.address}
    />
  )
}

function FreePostDetail({
  post,
}: {
  post: Post
}) {
  const { data: user } = useSuspenseQuery({
    queryKey: ['fetchUser', post.author],
    queryFn: () => fetchUser(post.author),
  })
  const { data: content } = useSuspenseQuery({
    queryKey: ['fetchPostContent', post.postBlobId],
    queryFn: () => fetchPostContent(post.postBlobId),
  })

  const [reviewContent, setReviewContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const currentAccount = useCurrentAccount()
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  const isAuthor = currentAccount?.address === post.author

  useEffect(() => {
    const getReviews = async () => {
      try {
        setIsLoadingReviews(true)
        const fetchedReviews = await fetchPostReviews(post.id, post, currentAccount?.address)
        setReviews(fetchedReviews)
      }
      catch (error) {
        console.error('レビュー取得エラー:', error)
      }
      finally {
        setIsLoadingReviews(false)
      }
    }

    getReviews()
  }, [post.id, post, currentAccount?.address])

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    if (reviews.some(review => review.isCurrentUserReview)) {
      console.log('すでにレビューを投稿済みです')
      return
    }

    if (!reviewContent.trim() || isSubmitting || !post.metadata?.id) return

    setIsSubmitting(true)

    try {
      const tx = new Transaction()
      createReview(tx, post.metadata.id, reviewContent)

      const result = await signAndExecuteTransaction({ transaction: tx })
      console.log('レビュー投稿成功:', result)
      setReviewContent('')

      // レビュー投稿後に一覧を再取得
      const fetchedReviews = await fetchPostReviews(post.id, post)
      setReviews(fetchedReviews)
    }
    catch (err) {
      console.error('レビュー投稿エラー:', err)
    }
    finally {
      setIsSubmitting(false)
    }
  }

  const handleVoteReview = async (reaction: ReviewReaction, reviewId: string) => {
    if (!post.metadata?.id) return

    try {
      const tx = new Transaction()
      voteForReview(tx, reviewId, reaction)
      const result = await signAndExecuteTransaction({ transaction: tx })
      console.log('レビュー投稿成功:', result)
      setReviewContent('')

      // レビュー投稿後に一覧を再取得
      const fetchedReviews = await fetchPostReviews(post.id, post)
      setReviews(fetchedReviews)
    }
    catch (err) {
      console.error(`${reaction}投票エラー:`, err)
    }
    finally {
      setIsSubmitting(false)
    }
  }

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

        {post.thumbnailBlobId && (
          <div>
            <img
              src={`${AGGREGATOR}/v1/blobs/${post.thumbnailBlobId}`}
              alt={post.title}
              className="w-full h-auto max-h-[400px] object-cover rounded-lg shadow-md"
            />
          </div>
        )}

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

        </div>
        {content && <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />}

        <ReviewSection
          reviews={reviews}
          reviewContent={reviewContent}
          isSubmitting={isSubmitting}
          isAuthor={isAuthor}
          isLoadingReviews={isLoadingReviews}
          onReviewContentChange={setReviewContent}
          onSubmitReview={handleSubmitReview}
          onVoteReview={handleVoteReview}
        />
      </div>
    </div>
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

function PaidPostDetail({
  post,
  walletAddress,
}: {
  post: Post
  walletAddress: string | undefined
}) {
  const { data: user } = useSuspenseQuery({
    queryKey: ['fetchUser', post.author],
    queryFn: () => fetchUser(post.author),
  })

  const { mutate: signPersonalMessage } = useSignPersonalMessage()
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()

  const suiClient = useSuiClient()
  const sealClient = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers('testnet'),
    verifyKeyServers: false,
  })

  const [decryptedFileUrls, setDecryptedFileUrls] = useState<string[]>([])
  const [, setError] = useState<string | null>(null)
  const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(null)
  const [, setReloadKey] = useState(0)
  const [purchased, setPurchased] = useState(false)

  const [reviewContent, setReviewContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const currentAccount = useCurrentAccount()
  const isAuthor = currentAccount?.address === post.author

  useEffect(() => {
    const getReviews = async () => {
      try {
        setIsLoadingReviews(true)
        const fetchedReviews = await fetchPostReviews(post.id, post, currentAccount?.address)
        setReviews(fetchedReviews)
      }
      catch (error) {
        console.error('レビュー取得エラー:', error)
      }
      finally {
        setIsLoadingReviews(false)
      }
    }

    getReviews()
  }, [post.id, post, currentAccount?.address])

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    if (reviews.some(review => review.isCurrentUserReview)) {
      console.log('すでにレビューを投稿済みです')
      return
    }

    if (!reviewContent.trim() || isSubmitting || !post.metadata?.id) return

    setIsSubmitting(true)

    try {
      const tx = new Transaction()
      createReview(tx, post.metadata.id, reviewContent)

      const result = await signAndExecuteTransaction({ transaction: tx })
      console.log('レビュー投稿成功:', result)
      setReviewContent('')
      const fetchedReviews = await fetchPostReviews(post.id, post)
      setReviews(fetchedReviews)
    }
    catch (err) {
      console.error('レビュー投稿エラー:', err)
      setIsSubmitting(false)
    }
    finally {
      setIsSubmitting(false)
    }
  }

  const handleVoteReview = async (reaction: ReviewReaction, reviewId: string) => {
    if (!post.metadata?.id) return

    try {
      const tx = new Transaction()
      voteForReview(tx, reviewId, reaction)

      const result = await signAndExecuteTransaction({ transaction: tx })
      console.log(`${reaction}投票成功:`, result)

      // 投票後にレビュー一覧を再取得
      const fetchedReviews = await fetchPostReviews(post.id, post)
      setReviews(fetchedReviews)
    }
    catch (err) {
      console.error(`${reaction}投票エラー:`, err)
    }
  }

  console.log('decryptedFileUrls', decryptedFileUrls)

  const onView = async () => {
    if (!post.metadata || !walletAddress) {
      return
    }

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
            if (!post.metadata) {
              return
            }
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
    catch (error) {
      console.error('Error:', error)
    }
  }

  const purchase = async () => {
    if (!post.metadata || !walletAddress) {
      return
    }

    const tx = new Transaction()
    const [suiCoin] = await getInputCoins(
      tx,
      suiClient,
      walletAddress,
      COINS_TYPE_LIST.SUI,
      post.metadata.price,
    )
    BlogModule.purchasePost(tx, SHAKE_ONIGIRI.testnet.packageId, SHAKE_ONIGIRI.testnet.postPaymentObjectId, post.metadata.id, suiCoin)

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
    if (!post.metadata) {
      return
    }

    const tx = new Transaction()
    BlogModule.isPurchasedPost(
      tx,
      SHAKE_ONIGIRI.testnet.packageId,
      SHAKE_ONIGIRI.testnet.postPaymentObjectId,
      post.metadata.id,
    )

    const blockResults = await devInspectAndGetExecutionResults(suiClient, tx, walletAddress)
    const txResults = blockResults[0]
    if (!txResults.returnValues?.length) {
      throw Error(`transaction didn't return any values: ${JSON.stringify(txResults, null, 2)}`)
    }

    const value = txResults.returnValues[0]
    const valueData = value[0]
    const result = valueData[0]

    setPurchased(result === 1)
  }

  useEffect(() => {
    isPurchased()
  }, [walletAddress])

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

        {post.thumbnailBlobId && (
          <div>
            <img
              src={`${AGGREGATOR}/v1/blobs/${post.thumbnailBlobId}`}
              alt={post.title}
              className="w-full h-auto max-h-[400px] object-cover rounded-lg shadow-md"
            />
          </div>
        )}

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
            {post.metadata && post.metadata.price > 0 && !purchased
              && (
                <Button className="gap-2" onClick={purchase}>
                  記事を購入
                  {' '}
                  {post.metadata.price / 1000000000}
                  {' '}
                  SUI
                </Button>
              )}
          </div>
        </div>

        {decryptedFileUrls && decryptedFileUrls.length > 0 && <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: decryptedFileUrls[0] }} />}

        <ReviewSection
          reviews={reviews}
          reviewContent={reviewContent}
          isSubmitting={isSubmitting}
          isAuthor={isAuthor}
          isLoadingReviews={isLoadingReviews}
          onReviewContentChange={setReviewContent}
          onSubmitReview={handleSubmitReview}
          onVoteReview={handleVoteReview}
        />
      </div>
    </div>
  )
}
