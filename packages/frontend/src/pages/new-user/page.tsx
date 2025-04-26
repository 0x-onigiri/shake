import { useActionState, useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import { useForm, getFormProps, getInputProps } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { SHAKE_ONIGIRI } from '@/constants'
import { UserModule } from '@/lib/sui/user-functions'
import { Textarea } from '@/components/ui/textarea'
import { uploadToWalrus } from '@/lib/sui/walrus'
import { sleep } from '@/lib/utils'

export type FormState = {
  username: string
  bio: string
  image: File | null
}

export type ActionState = {
  message?: string
  error?: string
  success?: boolean
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

const userSchema = z.object({
  username: z.string().min(2, { message: 'Username must be at least 2 characters long' }),
  bio: z.string().max(500, { message: 'Bio must be 500 characters or less' }).optional(),
  image: z
    .instanceof(File, { message: 'Please select an image file' })
    .refine(file => file?.size > 0, 'Please select an image file')
    .refine(file => file?.size <= MAX_FILE_SIZE, `Image size must be 5MB or less`)
    .refine(
      file => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      'Only .jpg, .jpeg, .png, .webp, .gif formats are allowed',
    ),
})

export default function Page() {
  const [lastResult, formAction, pending] = useActionState(registerUser, undefined)
  const [form, fields] = useForm({

    lastResult,

    onValidate({ formData }) {
      return parseWithZod(formData, { schema: userSchema })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  })
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const currentAccount = useCurrentAccount()
  const navigate = useNavigate()
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()

  async function registerUser(_: unknown, formData: FormData) {
    const submission = parseWithZod(formData, { schema: userSchema })

    if (submission.status !== 'success') {
      return submission.reply()
    }

    if (!currentAccount) {
      return submission.reply({ formErrors: ['Wallet not connected'] })
    }

    const { username, bio, image } = submission.value

    try {
      if (!(image instanceof File)) {
        return submission.reply({ fieldErrors: { image: ['Invalid image file'] } })
      }

      const blobId = await uploadToWalrus(image)
      const tx = new Transaction()

      UserModule.createUser(
        tx,
        SHAKE_ONIGIRI.testnet.packageId,
        SHAKE_ONIGIRI.testnet.userListObjectId,
        username,
        blobId,
        bio || '',
      )

      await signAndExecuteTransaction({ transaction: tx })

      await sleep(1500)

      await navigate(`/user/${currentAccount.address}`)

      return submission.reply({ resetForm: true })
    }
    catch (error) {
      console.error('Registration error:', error)

      return submission.reply({ formErrors: ['An error occurred during user registration. Please try again later.'] })
    }
  }

  useEffect(() => {
    const file = fields.image.value
    if (file instanceof File && file.size > 0) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    else {
      setPreviewUrl(null)
    }
  }, [fields.image.value])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          Create Profile
        </CardTitle>
      </CardHeader>
      <CardContent>

        {form.errors && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{form.errors}</AlertDescription>
          </Alert>
        )}

        <form {...getFormProps(form)} action={formAction} className="space-y-6">

          <div className="space-y-2">
            <Label htmlFor={fields.username.id}>Username</Label>
            <Input {...getInputProps(fields.username, { type: 'text' })} placeholder="Enter username" required />
            {fields.username.errors && (
              <p className="text-sm text-red-500">{fields.username.errors}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={fields.bio.id}>Bio</Label>
            <Textarea
              {...getInputProps(fields.bio, { type: 'text' })}
              placeholder="Enter your bio (max 500 characters)"
              rows={3}
            />
            {fields.bio.errors && (
              <p className="text-sm text-red-500">{fields.bio.errors}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={fields.image.id}>Profile Image</Label>
            <Input
              {...getInputProps(fields.image, { type: 'file' })}
              accept="image/*"

              required
            />
            {fields.image.errors && (
              <p className="text-sm text-red-500">{fields.image.errors}</p>
            )}

            {previewUrl && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <div className="relative w-24 h-24 rounded-full overflow-hidden border border-gray-200">
                  <img src={previewUrl || '/placeholder.svg'} alt="Preview" className="w-full h-full object-cover" />
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
