import { useActionState } from 'react'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { SHAKE_ONIGIRI } from '@/constants'
import { UserModule } from '@/lib/sui/user-functions'
import { Textarea } from "@/components/ui/textarea"

// Walrus Testnetのパブリッシャーとアグリゲーターのエンドポイント
const PUBLISHER = 'https://publisher.walrus-testnet.walrus.space'

// 画像をWalrusにアップロード
const uploadImageToWalrus = async (file: File) => {
  try {
    const response = await fetch(`${PUBLISHER}/v1/blobs`, {
      method: 'PUT',
      body: file,
    })

    if (!response.ok) {
      throw new Error(`画像アップロード失敗: ${response.statusText}`)
    }

    return await response.json()
  }
  catch (error) {
    console.error('画像アップロードエラー:', error)
    throw error
  }
}

// フォームの状態を定義する型
export type FormState = {
  username: string
  bio: string
  image: File | null
}

// アクションの結果を定義する型
export type ActionState = {
  message?: string
  error?: string
  success?: boolean
  fieldErrors?: {
    username?: string[]
    bio?: string[]
    image?: string[]
  }
}

// 初期状態
const initialState: ActionState = {
  message: '',
  error: '',
  success: false,
  fieldErrors: {
    username: [],
    bio: [],
    image: [],
  },
}

export default function NewUserPage() {
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  // useActionStateを使用してフォームの状態を管理

  // クライアントサイドでのフォーム処理関数
  async function registerUser(_: ActionState | undefined, formData: FormData): Promise<ActionState> {
    try {
    // ユーザー名の検証
      const username = formData.get('username') as string
      if (!username || username.length < 3) {
        return {
          fieldErrors: {
            username: ['ユーザー名は3文字以上で入力してください'],
          },
        }
      }

      // 一応500文字以内とした
      const bio = formData.get('bio') as string || ''
      if (bio.length > 500) {
        return {
          fieldErrors: {
            bio: ['自己紹介は500文字以内で入力してください'],
          },
        }
      }

      // 画像ファイルの検証
      const imageFile = formData.get('image') as File
      if (!imageFile || imageFile.size === 0) {
        return {
          fieldErrors: {
            image: ['画像ファイルを選択してください'],
          },
        }
      }

      // 画像の種類を検証
      if (!imageFile.type.startsWith('image/')) {
        return {
          fieldErrors: {
            image: ['アップロードできるのは画像ファイルのみです'],
          },
        }
      }

      // 画像サイズの検証（5MB以下）
      if (imageFile.size > 5 * 1024 * 1024) {
        return {
          fieldErrors: {
            image: ['画像サイズは5MB以下にしてください'],
          },
        }
      }

      const imageResponse = await uploadImageToWalrus(imageFile)
      console.log('画像アップロード成功:', imageResponse)

      let imageBlobId = ''
      // let imageSuiObjectId = ''
      // const imageCost = 0

      if (imageResponse.newlyCreated) {
        imageBlobId = imageResponse.newlyCreated.blobObject.blobId
      // imageSuiObjectId = imageResponse.newlyCreated.blobObject.id
      }
      else if (imageResponse.alreadyCertified) {
        imageBlobId = imageResponse.alreadyCertified.blobId
      // alreadyCertifiedの場合はオブジェクトIDが直接含まれていない可能性があります
      // トランザクションダイジェストから取得する必要があるかもしれません
      // imageSuiObjectId
      //     = imageResponse.alreadyCertified.event?.txDigest || '不明'
      }

      const tx = new Transaction()

      const [userActivity] = UserModule.create_new_user(
        tx,
        SHAKE_ONIGIRI.testnet.packageId,
        SHAKE_ONIGIRI.testnet.userListObjectId,
        username,
        imageBlobId,
        bio,
      )
      UserModule.delete_user_activity(tx, SHAKE_ONIGIRI.testnet.packageId, userActivity)

      signAndExecuteTransaction(
        {
          transaction: tx,
          chain: 'sui:testnet',
        },
        {
          onSuccess: (result) => {
            console.log('executed createNewUser transaction', result)
            window.location.reload()
          },
          onError: (error) => {
            console.error('createNewUser error', error)
          },
        },
      )

      // 成功レスポンスを返す
      return {
        success: true,
        message: 'ユーザー登録が完了しました！',
      }
    }
    catch (error) {
      console.error('登録エラー:', error)
      return {
        error: 'ユーザー登録中にエラーが発生しました。後でもう一度お試しください。',
      }
    }
  }

  const [state, formAction, pending] = useActionState(registerUser, initialState)

  // 画像プレビュー用の状態
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // フォームのリセット用
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // 画像ファイルの変更を処理する関数
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // プレビューURLを作成
      const url = URL.createObjectURL(file)

      // 古いプレビューがあればクリア
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      setPreviewUrl(url)
    }
  }

  // 成功時にフォームをリセットする
  if (state?.success && formRef.current) {
    formRef.current.reset()
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>プロフィールを作成する</CardTitle>
      </CardHeader>
      <CardContent>
        {state?.error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {state?.success && state?.message && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        <form ref={formRef} action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">ユーザー名</Label>
            <Input id="username" name="username" placeholder="ユーザー名を入力" required />
            {state?.fieldErrors?.username && state.fieldErrors.username.length > 0 && (
              <p className="text-sm text-red-500">{state.fieldErrors.username[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">自己紹介</Label>
            <Textarea 
              id="bio" 
              name="bio" 
              placeholder="自己紹介を500文字以内で入力してください"
              rows={3} 
            />
            {state?.fieldErrors?.bio && state.fieldErrors.bio.length > 0 && (
              <p className="text-sm text-red-500">{state.fieldErrors.bio[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">プロフィール画像</Label>
            <Input
              id="image"
              name="image"
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              required
            />
            {state?.fieldErrors?.image && state.fieldErrors.image.length > 0 && (
              <p className="text-sm text-red-500">{state.fieldErrors.image[0]}</p>
            )}

            {previewUrl && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">プレビュー:</p>
                <div className="relative w-24 h-24 rounded-full overflow-hidden border border-gray-200">
                  <img src={previewUrl || '/placeholder.svg'} alt="プレビュー" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                )
              : (
                  'Create'
                )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
