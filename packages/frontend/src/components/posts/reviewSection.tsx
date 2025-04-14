import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
  onReviewContentChange: (value: string) => void
  onSubmitReview: (e: React.FormEvent) => void
  onVoteReview: (reviewId: string, reaction: 'Helpful' | 'NotHelpful') => void
}

export function ReviewSection({
  reviews = [],
  reviewContent,
  isSubmitting,
  isAuthor,
  onReviewContentChange,
  onSubmitReview,
  onVoteReview
}: ReviewSectionProps) {
  return (
    <div className="space-y-8">
      <div className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">レビュー {reviews.length}件</h2>
        
        {/* 自身のpostでない場合レビュー入力可能 */}
        {!isAuthor && (
          <form onSubmit={onSubmitReview} className="space-y-4">
            <Textarea
              placeholder="コメントを入力..."
              value={reviewContent}
              onChange={(e) => onReviewContentChange(e.target.value)}
              className="min-h-[100px]"
              disabled={isSubmitting}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '投稿中...' : '投稿する'}
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-gray-500">まだレビューがありません</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {review.author.image ? (
                    <img
                      src={review.author.image}
                      alt={review.author.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
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
                        onClick={() => onVoteReview(review.id, 'Helpful')}
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
                        onClick={() => onVoteReview(review.id, 'NotHelpful')}
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