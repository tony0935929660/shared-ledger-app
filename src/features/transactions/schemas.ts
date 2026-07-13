import { z } from 'zod'

const maxAttachmentBytes = 5 * 1024 * 1024
const allowedAttachmentTypes = ['image/jpeg', 'image/png', 'image/webp']

export const transactionFormSchema = z
  .object({
    type: z.enum(['income', 'expense', 'capital']),
    title: z.string().trim().min(1, '項目名稱必填').max(100, '項目名稱最多 100 字'),
    amount: z
      .string()
      .trim()
      .min(1, '金額必填')
      .refine((value) => {
        const parsed = Number(value)
        return Number.isFinite(parsed) && parsed > 0
      }, '金額必須大於 0'),
    categoryId: z.string().uuid('分類必填'),
    transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式需為 YYYY-MM-DD'),
    note: z.string().max(1000, '備註最多 1000 字').optional().default(''),
    paymentMethod: z.enum(['company', 'member_advance']).nullable(),
    advanceMemberId: z.string().uuid().nullable(),
    attachments: z
      .array(z.instanceof(File))
      .max(5, '最多只能上傳 5 張')
      .refine((files) => files.every((file) => allowedAttachmentTypes.includes(file.type)), '附件格式僅限 JPEG / PNG / WebP')
      .refine((files) => files.every((file) => file.size <= maxAttachmentBytes), '單張附件大小不可超過 5MB'),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'expense') {
      if (value.paymentMethod === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['paymentMethod'],
          message: '支出必須選擇付款方式',
        })
      }

      if (value.paymentMethod === 'company' && value.advanceMemberId !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['advanceMemberId'],
          message: '公司付款不可選擇代墊人',
        })
      }

      if (value.paymentMethod === 'member_advance' && value.advanceMemberId === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['advanceMemberId'],
          message: '成員代墊必須選擇代墊人',
        })
      }
    }

    if ((value.type === 'income' || value.type === 'capital') && (value.paymentMethod !== null || value.advanceMemberId !== null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentMethod'],
        message: '收入與資本投入不得設定付款方式與代墊人',
      })
    }
  })

export type TransactionFormPayload = z.infer<typeof transactionFormSchema>
