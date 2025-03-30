import { useParams, Link } from 'react-router'
import { fetchPost } from '@/lib/shake-client'
import { useSuspenseQuery } from '@tanstack/react-query'
import type { Post } from '@/types'
import { fetchUser } from '@/lib/shake-client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Clock, Share2Icon } from 'lucide-react'
import { AGGREGATOR } from '@/constants'

const article = {
  title: 'Web3の未来を切り開くSuiとWalrus——失われたデータ主権性を取り戻す挑戦',
  content: `
      <p>デジタル社会が進展した現在、私たちのあらゆる活動はオンライン化し、その過程で膨大なデータが日々生み出されています。SNSの投稿履歴やオンライン決済情報、位置情報など、これらのデータを蓄積した巨大テック企業は、一国家と同等かそれ以上の影響力を持つようになりました。</p>
      <br>
      <br>
      <p>しかし多くのユーザーは、自分のデータがどこで、どのように使われているかを明確に把握できていません。広告やプロパガンダ、企業間取引など、当事者であるユーザーが知らぬ間にデータを利用される事例も後を絶ちません。</p>

      <figure style="text-align:center;" name="3e0b3b11-f432-4277-bcbe-68ded51e3d29" id="3e0b3b11-f432-4277-bcbe-68ded51e3d29"><a href="https://assets.st-note.com/img/1742966198-63h1tZENDPrb7pYxj4F5acHm.jpg?width=2000&amp;height=2000&amp;fit=bounds&amp;quality=85" aria-label="画像を拡大表示"><img style="margin: 0 auto;" src="https://assets.st-note.com/img/1742966198-63h1tZENDPrb7pYxj4F5acHm.jpg" alt="画像" width="512" height="288" loading="lazy" class="is-slide" data-modal="true"></a><figcaption>『グレート・ハック：SNS史上最悪のスキャンダル』</figcaption></figure>
    `,
  author: {
    name: '田中 智子',
    avatar: '/placeholder.svg?height=40&width=40',
  },
  publishedAt: '2024年3月15日',
  readTime: '8分',
  category: 'テクノロジー',
  isPremium: true,
  price: 500,
  image: '/placeholder.svg?height=400&width=800',
}

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

  if (!post) {
    return <div>Postが見つかりません</div>
  }

  return (
    <PostDetail post={post} />
  )
}

function PostDetail({
  post,
}: {
  post: Post
}) {
  const { data: user } = useSuspenseQuery({
    queryKey: ['fetchUser', post.author],
    queryFn: () => fetchUser(post.author),
  })

  if (!user) {
    return null
  }

  // return (
  //   <div className="space-y-4 px-4 py-8">
  //     <h1 className="text-3xl">{post.title}</h1>
  //     <p>
  //       by
  //       {' '}
  //       <Button asChild variant="link" className="p-0">
  //         <Link to={`/user/${post.author}`}>
  //           {user.username}
  //         </Link>
  //       </Button>
  //     </p>
  //   </div>
  // )

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* カテゴリーとメタ情報 */}
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

        {/* 記事タイトル */}
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">{article.title}</h1>

        {/* 著者情報 */}
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={`${AGGREGATOR}/v1/blobs/${user.image}`} alt={user.username} />
            <AvatarFallback>{user.username}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.username}</p>
          </div>
        </div>

        <div className="bg-amber-100 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex items-center justify-between">
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
          {/* <PurchaseModal article={article} /> */}
        </div>

        {/* メイン画像 */}
        {/* <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <img src="/placeholder.svg" className="object-cover" />
        </div> */}

        {/* 記事本文 */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* シェアボタン */}
        <div className="flex justify-end pt-6 border-t">
          <Button variant="outline" size="sm" className="gap-2">
            <Share2Icon className="h-4 w-4" />
            シェアする
          </Button>
        </div>

      </div>
    </div>
  )
}
