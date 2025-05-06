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
import { SHAKE_ONIGIRI, COINS_TYPE_LIST } from '@/constants'
import { Book } from 'lucide-react'
import { getInputCoins, downloadAndDecrypt, MoveCallConstructor } from '@/lib/sui/utils'
import { BlogModule } from '@/lib/sui/blog-functions'
import { devInspectAndGetExecutionResults } from '@polymedia/suitcase-core'
import { ReviewSection } from '@/components/posts/review-section'

import { PostHeader } from './post-header'
import { PostThumbnail } from './post-thumbnail'
import { PostAuthorInfo } from './post-author-info'

export default function Page() {
  const { postId } = useParams()

  if (!postId) {
    return <div>Post ID is not specified</div>
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
    return <div>Post not found</div>
  }

  if (post.metadata.price === 0) {
    return (
      <FreePostDetail
        post={post}
        reviewIds={post.metadata.reviews}
        walletAddress={currentAccount?.address}
        isAuthor={currentAccount?.address === post.author}
      />
    )
  }

  return (
    <PaidPostDetail
      post={post}
      reviewIds={post.metadata.reviews}
      walletAddress={currentAccount?.address}
      isAuthor={currentAccount?.address === post.author}
    />
  )
}

function FreePostDetail({
  post,
  reviewIds,
  walletAddress,
  isAuthor,
}: {
  post: Post
  reviewIds: string[]
  walletAddress: string | undefined
  isAuthor: boolean
}) {
  const { data: user } = useSuspenseQuery({
    queryKey: ['fetchUser', post.author],
    queryFn: () => fetchUser(post.author),
  })
  const { data: content } = useSuspenseQuery({
    queryKey: ['fetchPostContent', post.postBlobId],
    queryFn: () => fetchPostContent(post.postBlobId),
  })

  const { data: reviews, isLoading: isLoadingReviews, refetch: refetchReviews } = useSuspenseQuery({
    queryKey: ['fetchPostReviews', post.id],
    queryFn: () => fetchPostReviews(reviewIds, walletAddress),
  })

  const suiClient = useSuiClient()
  const [reviewContent, setReviewContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    if (reviews.some(review => review.isCurrentUserReview)) {
      console.log('You have already posted a review')
      return
    }

    if (!reviewContent.trim() || isSubmitting || !post.metadata?.id) return

    setIsSubmitting(true)

    try {
      const tx = new Transaction()
      createReview(tx, post.metadata.id, reviewContent)

      const result = await signAndExecuteTransaction({ transaction: tx })
      await suiClient.waitForTransaction({
        digest: result.digest,
      })
      console.log('Review posted successfully:', result)
      setReviewContent('')
      await refetchReviews()
    }
    catch (err) {
      console.error('Error posting review:', err)
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
      await suiClient.waitForTransaction({
        digest: result.digest,
      })
      console.log('Review posted successfully:', result)
      setReviewContent('')
      await refetchReviews()
    }
    catch (err) {
      console.error(`Error voting ${reaction}:`, err)
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
        <PostHeader />

        <PostThumbnail thumbnailBlobId={post.thumbnailBlobId} title={post.title} />

        <h1 className="text-3xl md:text-4xl font-bold leading-tight">{post.title}</h1>

        <PostAuthorInfo user={user} />
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
  reviewIds,
  walletAddress,
  isAuthor,
}: {
  post: Post
  reviewIds: string[]
  walletAddress: string | undefined
  isAuthor: boolean
}) {
  const { data: user } = useSuspenseQuery({
    queryKey: ['fetchUser', post.author],
    queryFn: () => fetchUser(post.author),
  })

  const { data: reviews, isLoading: isLoadingReviews, refetch: refetchReviews } = useSuspenseQuery({
    queryKey: ['fetchPostReviews', post.id],
    queryFn: () => fetchPostReviews(reviewIds, walletAddress),
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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    if (reviews.some(review => review.isCurrentUserReview)) {
      console.log('You have already posted a review')
      return
    }

    if (!reviewContent.trim() || isSubmitting || !post.metadata?.id) return

    setIsSubmitting(true)

    try {
      const tx = new Transaction()
      createReview(tx, post.metadata.id, reviewContent)

      const result = await signAndExecuteTransaction({ transaction: tx })
      await suiClient.waitForTransaction({
        digest: result.digest,
      })
      console.log('Review posted successfully:', result)
      setReviewContent('')
      await refetchReviews()
    }
    catch (err) {
      console.error('Error posting review:', err)
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
      await suiClient.waitForTransaction({
        digest: result.digest,
      })
      console.log(`Voted ${reaction} successfully:`, result)
      await refetchReviews()
    }
    catch (err) {
      console.error(`Error voting ${reaction}:`, err)
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
        <PostHeader />

        <PostThumbnail thumbnailBlobId={post.thumbnailBlobId} title={post.title} />

        <h1 className="text-3xl md:text-4xl font-bold leading-tight">{post.title}</h1>

        <div className="flex items-center justify-between gap-3">
          <PostAuthorInfo user={user} />
          <div className="flex items-center gap-3">
            {purchased && decryptedFileUrls.length === 0
              && (
                <Button variant="secondary" size="sm" className="gap-2" onClick={onView}>
                  <Book className="h-4 w-4" />
                  Sign to read
                </Button>
              )}
            {post.metadata && post.metadata.price > 0 && !purchased
              && (
                <Button className="gap-2" onClick={purchase}>
                  Purchase Article
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
