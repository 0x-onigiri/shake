import { useActionState, useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { SHAKE_ONIGIRI } from '@/constants'
import { UserModule } from '@/lib/sui/user-functions'
import { Textarea } from '@/components/ui/textarea'
import { uploadToWalrus } from '@/lib/sui/walrus'

export type FormState = {
  username: string
  bio: string
  image: File | null
}

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

export default function Page() {
  const [state, formAction, pending] = useActionState(registerUser, initialState)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const currentAccount = useCurrentAccount()
  const navigate = useNavigate()
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()

  async function registerUser(_: ActionState | undefined, formData: FormData): Promise<ActionState> {
    if (!currentAccount) {
      return {
        error: 'ウォレットが接続されていません',
      }
    }

    try {
      const username = formData.get('username') as string
      const bio = formData.get('bio') as string || ''
      const imageFile = formData.get('image') as File

      // ユーザー名の検証
      if (!username || username.length < 3) {
        return {
          fieldErrors: {
            username: ['ユーザー名は3文字以上で入力してください'],
          },
        }
      }

      // 一応500文字以内とした
      if (bio.length > 500) {
        return {
          fieldErrors: {
            bio: ['自己紹介は500文字以内で入力してください'],
          },
        }
      }

      // 画像ファイルの検証
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

      const blobId = await uploadToWalrus(imageFile)
      const tx = new Transaction()

      UserModule.createUser(
        tx,
        SHAKE_ONIGIRI.testnet.packageId,
        SHAKE_ONIGIRI.testnet.userListObjectId,
        username,
        blobId,
        bio,
      )

      await signAndExecuteTransaction({ transaction: tx })
      await navigate(`/user/${currentAccount.address}`)

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
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
