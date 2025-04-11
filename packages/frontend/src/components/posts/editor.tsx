'use client'

import type React from 'react'
import { useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Bold, Italic, List, ListOrdered, ImageIcon, Heading1, Heading2, Undo, Redo, Code } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { postSchema, type PostFormData } from '@/lib/schemas'

type Props = {
  onSave: (formData: PostFormData) => void
  pending?: boolean
}

export function Editor({ onSave, pending }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // React Hook Formの設定
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      content: '<p>ここに本文を入力してください...</p>',
      isPaid: false,
      amount: undefined,
    },
  })

  // isPaidの値を監視して自動的に処理
  const isPaid = watch('isPaid')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: '<p>ここに本文を入力してください...</p>',
    onUpdate: ({ editor }) => {
      // エディタの内容が変更されたら自動的にformの値を更新
      setValue('content', editor.getHTML(), { shouldValidate: true })
    },
  })

  const addImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        // 画像を追加した後もフォームの内容更新
        setValue('content', editor.getHTML(), { shouldValidate: true })
      }
    }
    reader.readAsDataURL(file)

    // ファイル選択をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = (data: PostFormData) => {
    onSave(data)
  }

  if (!editor) {
    return null
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-start gap-4">
          <div className="space-y-2">
            <Label>投稿タイプ</Label>
            <Controller
              name="isPaid"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value ? 'paid' : 'free'}
                  onValueChange={value => field.onChange(value === 'paid')}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="free" id="free" />
                    <Label htmlFor="free">無料</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paid" id="paid" />
                    <Label htmlFor="paid">有料</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>

          {isPaid && (
            <div className="space-y-2">
              <Label htmlFor="amount">金額(SUI)</Label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <Input
                    id="amount"
                    type="number"
                    onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                    value={!field.value ? '' : field.value}
                    placeholder="金額を入力"
                    className="max-w-xs"
                  />
                )}
              />
              {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
            </div>
          )}
        </div>

        <div className="space-y-2 mt-6">
          <Label htmlFor="title">タイトル</Label>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input
                id="title"
                {...field}
                placeholder="投稿タイトルを入力"
                className="text-lg"
              />
            )}
          />
          {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2 mt-6">
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
            {errors.content && <p className="text-sm text-red-500 px-4 pb-2">{errors.content.message}</p>}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={editor.isEmpty || pending}>
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
      </form>
    </div>
  )
}
