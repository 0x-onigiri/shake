import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AGGREGATOR } from '@/constants'
import type { ReviewReaction } from '@/types'
import { cn } from '@/lib/utils'
import {
  useCurrentAccount,
  ConnectModal,
} from '@mysten/dapp-kit'

interface Review {
  id: string
  content: string
  author: {
    name: string
    image?: string
  }
  createdAt: string
  helpfulCount: number
  notHelpfulCount: number
  isCurrentUserReview?: boolean
  currentUserVote?: ReviewReaction | null
}

interface ReviewSectionProps {
  reviews: Review[]
  reviewContent: string
  isSubmitting: boolean
  isAuthor: boolean
  isLoadingReviews: boolean
  onReviewContentChange: (value: string) => void
  onSubmitReview: (e: React.FormEvent) => void
  onVoteReview: (reaction: ReviewReaction, reviewId: string) => void
}

export function ReviewSection({
  reviews = [],
  reviewContent,
  isSubmitting,
  isAuthor,
  isLoadingReviews,
  onReviewContentChange,
  onSubmitReview,
  onVoteReview,
}: ReviewSectionProps) {
  const currentAccount = useCurrentAccount()
  return (
    <div className="space-y-8">
      <div className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">
          Reviews
          {reviews.length}
        </h2>

        {!isAuthor && !reviews.some(review => review.isCurrentUserReview)
          ? (
              <form onSubmit={onSubmitReview} className="space-y-4">
                <Textarea
                  placeholder="Enter your comment..."
                  value={reviewContent}
                  onChange={e => onReviewContentChange(e.target.value)}
                  className="min-h-[100px]"
                  disabled={isSubmitting}
                />
                <div className="flex justify-end">
                  {!currentAccount
                    ? (
                        <ConnectModal
                          trigger={(
                            <Button>
                              Connect Wallet
                            </Button>
                          )}
                        />
                      )
                    : (
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting
                            ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Posting...
                                </>
                              )
                            : (
                                'Post'
                              )}
                        </Button>
                      )}
                </div>
              </form>
            )
          : reviews.some(review => review.isCurrentUserReview) && !isAuthor
            ? (
                <div className="bg-secondary/20 border border-secondary/30 p-4 rounded-md mb-6">
                  <p className="text-secondary-foreground text-sm">You have already posted a review</p>
                </div>
              )
            : null}
      </div>

      <div className="space-y-6">
        {isLoadingReviews
          ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )
          : reviews.length === 0
            ? (
                <p className="text-gray-500">No reviews yet</p>
              )
            : (
                reviews.map(review => (
                  <div key={review.id} className="border-b pb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {review.author.image
                          ? (
                              <Avatar>
                                <AvatarImage src={`${AGGREGATOR}/v1/blobs/${review.author.image}`} alt={review.author.name} />
                                <AvatarFallback>{review.author.name}</AvatarFallback>
                              </Avatar>
                            )
                          : (
                              <Avatar>
                                <AvatarFallback>{review.author.name}</AvatarFallback>
                              </Avatar>
                            )}
                        <span className="font-medium">{review.author.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">{review.createdAt}</span>
                    </div>

                    <p className="mb-3 whitespace-pre-line break-words">{review.content}</p>

                    <div className="flex gap-4">
                      {isAuthor || review.isCurrentUserReview
                        ? (
                            <>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <ThumbsUp className="h-4 w-4" />
                                <span>{review.helpfulCount}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <ThumbsDown className="h-4 w-4" />
                                <span>{review.notHelpfulCount}</span>
                              </div>
                            </>
                          )
                        : (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={cn(
                                        'gap-2',
                                        review.currentUserVote === 'Helpful' && 'bg-orange-100 text-orange-600 hover:bg-orange-200 hover:text-orange-700',
                                      )}
                                      onClick={() => onVoteReview('Helpful', review.id)}
                                    >
                                      <ThumbsUp className="h-4 w-4" />
                                      <span>{review.helpfulCount}</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Helpful</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={cn(
                                        'gap-2',
                                        review.currentUserVote === 'NotHelpful' && 'bg-orange-100 text-orange-600 hover:bg-orange-200 hover:text-orange-700',
                                      )}
                                      onClick={() => onVoteReview('NotHelpful', review.id)}
                                    >
                                      <ThumbsDown className="h-4 w-4" />
                                      <span>{review.notHelpfulCount}</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Not helpful</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          )}
                    </div>
                  </div>
                ))
              )}
      </div>
    </div>
  )
}
