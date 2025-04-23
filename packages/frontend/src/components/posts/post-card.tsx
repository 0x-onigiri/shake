import { Link } from 'react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchUser } from '@/lib/shake-client'
import type { Post } from '@/types'
import { truncateAddress } from '@/lib/utils'
import { Card,
  CardFooter,
  CardContent,
  CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AGGREGATOR } from '@/constants'
import { CalendarIcon, Image } from 'lucide-react'

type Props = {
  post: Post
}

export function PostCard({
  post,
}: Props) {
  const { data: user } = useSuspenseQuery({
    queryKey: ['fetchUser', post.author],
    queryFn: () => fetchUser(post.author),
  })

  // タイトルを制限された長さで表示
  const truncateTitle = (title: string, maxLength = 50) => {
    if (title.length <= maxLength) return title;
    return `${title.substring(0, maxLength)}...`;
  };

  // 日付をフォーマット（数値のタイムスタンプ文字列として渡ってくる）
  const formatDate = (dateString: string) => {
    if (!dateString) return '日付不明';

    try {
      // 数値に変換
      const timestamp = parseInt(dateString, 10);
      
      // 有効な数値かチェック
      if (isNaN(timestamp)) {
        return '日付不明';
      }
      
      // タイムスタンプはミリ秒として扱う
      const date = new Date(timestamp);
      
      // 有効な日付かチェック
      if (isNaN(date.getTime())) {
        return '日付不明';
      }
      
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('日付フォーマットエラー:', error);
      return '日付不明';
    }
  };

  // postをanyにキャストして非標準プロパティにアクセス
  const postAny = post as any;

  return (
    <Link to={`/${post.id}`} className="block">
      <Card className="h-[280px] flex flex-col hover:shadow-md transition-shadow overflow-hidden p-0">
        {/* サムネイル画像 - 一時的にユーザーアイコンを表示 */}
        <div className="w-full h-32 bg-muted/30 flex items-center justify-center overflow-hidden">
          {user?.image ? (
            <img 
              src={`${AGGREGATOR}/v1/blobs/${user.image}`} 
              alt="サムネイル" 
              className="w-full h-full object-cover"
            />
          ) : (
            <Image className="h-16 w-16 text-muted-foreground/40" />
          )}
        </div>
        
        <div className="flex flex-col flex-1 p-0">
          {/* タイトル部分 */}
          <CardContent className="p-4 pt-0 pb-0">
            <CardTitle className="line-clamp-2 text-base">
              {truncateTitle(post.title)}
            </CardTitle>
          </CardContent>
          
          {/* 下部情報 - 自動的に下部に寄せられる */}
          <CardFooter className="mt-auto p-4 pt-2">
            <div className="flex flex-col space-y-1 w-full">
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  {user?.image ? (
                    <AvatarImage src={`${AGGREGATOR}/v1/blobs/${user.image}`} alt={user?.username || truncateAddress(post.author)} />
                  ) : null}
                  <AvatarFallback className="text-xs">{user?.username?.charAt(0) || post.author.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-xs">
                  {user?.username || truncateAddress(post.author)}
                </span>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarIcon className="h-3 w-3" />
                <span>{formatDate(postAny.created_at)}</span>
              </div>
            </div>
          </CardFooter>
        </div>
      </Card>
    </Link>
  )
}
