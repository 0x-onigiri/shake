import { useState, Suspense, useRef } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { fetchUser } from '@/lib/shake-client'
import { Card,
  CardContent } from '@/components/ui/card'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createPost } from '@/lib/shake-client'
import type { User } from '@/types'
import { SHAKE_ONIGIRI } from '@/constants'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Bold, Italic, List, ListOrdered, ImageIcon, Heading1, Heading2, Undo, Redo, Code } from 'lucide-react'

export default function CookPage() {
  const currentAccount = useCurrentAccount()

  if (!currentAccount) {
    return null
  }

  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <View walletAddress={currentAccount.address} />
      </Suspense>
    </div>
  )
}

function View({
  walletAddress,
}: {
  walletAddress: string
}) {
  const { data: user } = useSuspenseQuery({
    queryKey: ['fetchUser', walletAddress],
    queryFn: () => fetchUser(walletAddress),
  })

  if (!user) {
    return null
  }

  return (
    <div className="space-y-4">
      <CreatePost user={user} />
    </div>
  )
}

function CreatePost({
  user,
}: {
  user: User
}) {
  const client = useSuiClient()
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          // Raw effects are required so the effects can be reported back to the wallet
          showRawEffects: true,
          // Select additional data to return
          showObjectChanges: true,
          showEffects: true,
        },
      }),
  })
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)

  const handleSave = async (title: string, content: string) => {
    if (!user) return

    // TODO: ZOD
    if (!title.trim()) {
      alert('タイトルを入力してください')
      return
    }

    if (!content.trim()) {
      alert('本文を入力してください')
      return
    }

    try {
      setPending(true)
      const tx = await createPost(user.id, title, content)

      signAndExecuteTransaction(
        {
          transaction: tx,
          chain: 'sui:testnet',
        },
        {
          onSuccess: (result) => {
            console.log('executed transaction', result)
            const postId = result.objectChanges?.find(change =>
              change.type === 'created'
              && change.objectType === `${SHAKE_ONIGIRI.testnet.packageId}::blog::Post`,
            )?.objectId
            setPending(false)
            navigate(`/${postId}`)
          },
          onError: (error) => {
            console.error('error', error)
          },
        },
      )
    }
    catch (error) {
      console.error('error', error)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        New Shake
      </h1>
      <Editor onSave={handleSave} pending={pending} />

    </div>
  )
}

type EditorProps = {
  onSave: (title: string, content: string) => void
  pending?: boolean
}

function Editor({ onSave, pending }: EditorProps) {
  const [title, setTitle] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: '<p>ここに本文を入力してください...</p>',
  })

  const addImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange
    = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!editor) return

      const file = event.target.files?.[0]
      if (!file) return

      if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          editor.chain().focus().setImage({ src: result }).run()
        }
      }
      reader.readAsDataURL(file)

      // ファイル選択をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }

  const handleSave = () => {
    if (!editor) return
    if (!title.trim()) {
      alert('タイトルを入力してください')
      return
    }

    const content = editor.getHTML()
    onSave(title, content)
  }

  if (!editor) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="投稿タイトルを入力"
          className="text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label>本文</Label>
        <div className="border rounded-md">
          <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'bg-muted' : ''}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'bg-muted' : ''}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'bg-muted' : ''}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? 'bg-muted' : ''}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={editor.isActive('codeBlock') ? 'bg-muted' : ''}
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="ghost" onClick={addImage}>
              <ImageIcon className="h-4 w-4" />
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            <div className="ml-auto flex gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <EditorContent editor={editor} className="p-4 min-h-[300px] prose max-w-none" />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={editor.isEmpty || pending}
        >
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
      </div>
    </div>
  )
}
