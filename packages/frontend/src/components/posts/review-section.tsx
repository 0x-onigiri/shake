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
}

interface ReviewSectionProps {
  reviews: Review[]
  reviewContent: string
  isSubmitting: boolean
  isAuthor: boolean
  isLoadingReviews: boolean
  onReviewContentChange: (value: string) => void
  onSubmitReview: (e: React.FormEvent) => void
  onVoteReview: (reaction: ReviewReaction) => void
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
  return (
    <div className="space-y-8">
      <div className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">
          レビュー
          {reviews.length}
          件
        </h2>

        {!isAuthor && (
          <form onSubmit={onSubmitReview} className="space-y-4">
            <Textarea
              placeholder="コメントを入力..."
              value={reviewContent}
              onChange={e => onReviewContentChange(e.target.value)}
              className="min-h-[100px]"
              disabled={isSubmitting}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        投稿中...
                      </>
                    )
                  : (
                      '投稿する'
                    )}
              </Button>
            </div>
          </form>
        )}
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
                <p className="text-gray-500">まだレビューがありません</p>
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

                    <p className="mb-3">{review.content}</p>

                    <div className="flex gap-4">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() => onVoteReview('Helpful')}
                            >
                              <ThumbsUp className="h-4 w-4" />
                              <span>{review.helpfulCount}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>参考になった</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() => onVoteReview('NotHelpful')}
                            >
                              <ThumbsDown className="h-4 w-4" />
                              <span>{review.notHelpfulCount}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>参考にならなかった</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))
              )}
      </div>
    </div>
  )
}
