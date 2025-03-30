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
  title: 'AIが変える未来の働き方：2025年のオフィス環境予測',
  content: `
      <p>近年、人工知能（AI）技術の急速な発展により、私たちの働き方は大きく変わりつつあります。特に2025年に向けて、オフィス環境はどのように変化していくのでしょうか。</p>
      
      <h2>AIアシスタントの普及</h2>
      <p>現在でも様々な形で活用されているAIアシスタントですが、2025年にはさらに高度化し、ほぼすべての業務プロセスに組み込まれることが予想されています。会議の自動議事録作成、スケジュール調整、データ分析など、定型業務の多くがAIによって自動化されるでしょう。</p>
      
      <h2>ハイブリッドワークの標準化</h2>
      <p>パンデミック以降、リモートワークとオフィスワークを組み合わせたハイブリッドワークが普及しましたが、2025年にはこのモデルがさらに洗練されます。AIを活用した協働ツールにより、物理的な場所に関係なく、チームのコラボレーションがシームレスに行われるようになります。</p>
      
      <h2>パーソナライズされた職場環境</h2>
      <p>AIが個々の従業員の好みや作業パターンを学習し、照明、温度、デスクの高さなどを自動的に調整する「スマートオフィス」が一般的になるでしょう。これにより、従業員の快適性と生産性が向上します。</p>
      
      <h2>継続的なスキルアップデート</h2>
      <p>技術の進化が加速する中、従業員のスキルを常に最新に保つことが重要になります。AIを活用した学習プラットフォームが、各従業員に最適化されたトレーニングプログラムを提供し、継続的な学習文化を促進します。</p>
      
      <h2>課題と展望</h2>
      <p>AIの導入に伴い、プライバシーやセキュリティの懸念、人間の創造性の役割など、新たな課題も生じています。しかし、適切に管理されれば、AIは人間の能力を拡張し、より創造的で意義のある仕事に集中できる環境を作り出すでしょう。</p>
      
      <p>2025年のオフィスは、単なる仕事をする場所ではなく、AIと人間が協働する創造的なハブとなるでしょう。この変革に備え、企業は技術投資だけでなく、組織文化や人材育成の戦略も見直す必要があります。</p>
    `,
  author: {
    name: '田中 智子',
    avatar: '/placeholder.svg?height=40&width=40',
    title: 'テクノロジーアナリスト',
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
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">{post.title}</h1>

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
