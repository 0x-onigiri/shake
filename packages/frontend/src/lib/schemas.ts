import { z } from 'zod'

export const baseSchema = z.object({
  title: z.string().min(1, 'タイトルを入力してください'),
  content: z.string().min(1, '本文を入力してください'),
})

const freePostSchema = baseSchema.extend({
  isPaid: z.literal(false),
  amount: z.number().positive().optional().nullable(), // 任意、入力するなら正の数
})

// isPaid: true のスキーマ
const paidPostSchema = baseSchema.extend({
  isPaid: z.literal(true),
  amount: z.number().positive('有料の場合は金額を入力し、0より大きい値を入力してください'), // 必須かつ正の数
})

// isPaid の値によってスキーマを切り替える
export const postSchema = z.discriminatedUnion('isPaid', [
  freePostSchema,
  paidPostSchema,
])

export type PostFormData = z.infer<typeof postSchema>
