'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSession } from 'next-auth/react'
import {
  Upload, X, CheckCircle, Loader2, ChevronRight, ChevronLeft, File,
  Info, TrendingUp, AlertCircle, ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { calculateEstimate, type PriceEstimate, type WorkType } from '@/lib/pricing'
import { revealFrom } from '@/components/home/reveal'

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const step1Schema = z.object({
  type: z.enum(['essay', 'coursework', 'diploma', 'lab', 'presentation', 'practice-report', 'uir', 'other'], {
    errorMap: () => ({ message: 'Выберите тип работы' }),
  }),
  subject: z.string().min(2, 'Укажите предмет'),
  deadline: z.string().refine((d) => {
    if (!d) return false
    const date = new Date(d)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return date >= tomorrow
  }, 'Дедлайн должен быть не раньше завтра'),
})

const step2Schema = z.object({
  description: z.string().min(50, 'Описание должно содержать минимум 50 символов'),
})

const step3Schema = z.object({
  name: z.string().min(2, 'Укажите ваше имя'),
  email: z.string().email('Некорректный email'),
  phone: z.string().optional(),
  consent: z.boolean().refine((v) => v === true, 'Необходимо согласие на обработку данных'),
})

type FormData = z.infer<typeof step1Schema> & z.infer<typeof step2Schema> & z.infer<typeof step3Schema>

// ─── Constants ────────────────────────────────────────────────────────────────

const stepTitles = ['Тип работы', 'Описание запроса', 'Контактные данные']

const WORK_TYPE_LABELS: Record<WorkType | 'other', string> = {
  essay: 'Реферат / эссе',
  coursework: 'Курсовая работа',
  diploma: 'ВКР / Дипломная работа',
  lab: 'Лабораторная / практическая',
  presentation: 'Презентация',
  'practice-report': 'Отчёт по практике',
  uir: 'УИР',
  other: 'Другой тип работы',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length <= 1) return '+7'
  const rest = digits.startsWith('7') || digits.startsWith('8') ? digits.slice(1) : digits
  let result = '+7'
  if (rest.length > 0) result += ' ' + rest.slice(0, 3)
  if (rest.length > 3) result += ' ' + rest.slice(3, 6)
  if (rest.length > 6) result += '-' + rest.slice(6, 8)
  if (rest.length > 8) result += '-' + rest.slice(8, 10)
  return result
}

const getTomorrowDate = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

// ─── PriceEstimateBlock ───────────────────────────────────────────────────────

interface PriceEstimateBlockProps {
  estimate: PriceEstimate
  compact?: boolean
}

function PriceEstimateBlock({ estimate, compact = false }: PriceEstimateBlockProps) {
  const [showFlags, setShowFlags] = useState(false)

  const confidenceLabel =
    estimate.kind === 'manual'
      ? null
      : estimate.confidence === 'high'
      ? 'Высокая точность'
      : estimate.confidence === 'medium'
      ? 'Средняя точность'
      : 'Предварительная оценка'

  const confidenceColor =
    estimate.confidence === 'high'
      ? 'text-success'
      : estimate.confidence === 'medium'
      ? 'text-warning'
      : 'text-ink-soft'

  if (compact) {
    return (
      <div className="bevel-in bg-paper px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-ink-soft text-sm">
          <TrendingUp className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>Предв. стоимость</span>
        </div>
        <span
          className={`font-mono font-bold text-base px-2 py-0.5 ${
            estimate.kind === 'manual' ? 'text-ink-soft' : 'bg-accent text-ink'
          }`}
        >
          {estimate.label}
        </span>
      </div>
    )
  }

  return (
    <div className="bevel-in bg-paper p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-title flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium text-ink-soft">Предварительная стоимость</span>
        </div>
        {confidenceLabel && (
          <span className={`text-xs font-semibold ${confidenceColor}`}>{confidenceLabel}</span>
        )}
      </div>

      <div className="mb-3">
        <span
          className={`inline-block font-mono text-2xl font-bold px-3 py-1 ${
            estimate.kind === 'manual' ? 'text-ink-soft' : 'bg-accent text-ink'
          }`}
        >
          {estimate.label}
        </span>
      </div>

      {estimate.kind !== 'manual' && estimate.flags.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowFlags((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-ink-soft hover:text-title transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-dotted focus-visible:outline-offset-2 focus-visible:outline-ink"
            aria-expanded={showFlags}
          >
            <Info className="w-3 h-3" aria-hidden="true" />
            {showFlags ? 'Скрыть факторы' : `Факторы расчёта (${estimate.flags.length})`}
          </button>
          <AnimatePresence>
            {showFlags && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 space-y-1 overflow-hidden"
              >
                {estimate.flags.map((flag, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-xs text-ink-soft">
                    <span className="w-1 h-1 bg-title flex-shrink-0" aria-hidden="true" />
                    {flag}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}

      {estimate.kind === 'manual' && (
        <p className="text-xs text-ink-soft flex items-start gap-1.5">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
          Уточним стоимость после изучения деталей
        </p>
      )}
    </div>
  )
}

// ─── OrderForm ────────────────────────────────────────────────────────────────

export function OrderForm() {
  const { toast } = useToast()
  const { status: authStatus } = useSession()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [formData, setFormData] = useState<Partial<FormData>>({})

  const {
    register: register1,
    handleSubmit: handleSubmit1,
    setValue: setValue1,
    watch: watch1,
    formState: { errors: errors1 },
  } = useForm<z.infer<typeof step1Schema>>({ resolver: zodResolver(step1Schema) })

  const {
    register: register2,
    handleSubmit: handleSubmit2,
    watch: watch2,
    formState: { errors: errors2 },
  } = useForm<z.infer<typeof step2Schema>>({ resolver: zodResolver(step2Schema) })

  const {
    register: register3,
    handleSubmit: handleSubmit3,
    watch: watch3,
    setValue: setValue3,
    formState: { errors: errors3 },
  } = useForm<z.infer<typeof step3Schema>>({ resolver: zodResolver(step3Schema) })

  // ─── Pricing state ──────────────────────────────────────────────────────────

  const step1Type = watch1('type') as WorkType | undefined
  const step1Subject = watch1('subject') || ''
  const step1Deadline = watch1('deadline') || ''
  const description = watch2('description') || ''

  // Live estimate — recomputes on every relevant change
  const estimate = useMemo<PriceEstimate | null>(() => {
    const type = step1Type || formData.type
    const subject = step1Subject || formData.subject || ''
    const deadline = step1Deadline || formData.deadline || ''
    if (!type || !subject || !deadline) return null
    return calculateEstimate({
      type: type as WorkType,
      subject,
      deadline,
      description: description || formData.description || '',
      filesCount: files.length,
    })
  }, [step1Type, step1Subject, step1Deadline, description, files.length, formData])

  // ─── File handlers ──────────────────────────────────────────────────────────

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (authStatus !== 'authenticated') {
      toast({ title: 'Войдите, чтобы прикрепить файлы', description: 'Заявку можно отправить без файлов.' })
      return
    }
    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles((prev) => [...prev, ...droppedFiles].slice(0, 10))
  }, [authStatus, toast])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (authStatus !== 'authenticated') {
      toast({ title: 'Войдите, чтобы прикрепить файлы', description: 'Заявку можно отправить без файлов.' })
      e.target.value = ''
      return
    }
    const selected = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...selected].slice(0, 10))
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // ─── Step handlers ──────────────────────────────────────────────────────────

  const onStep1Submit = (data: z.infer<typeof step1Schema>) => {
    setFormData((prev) => ({ ...prev, ...data }))
    setStep(2)
  }

  const onStep2Submit = (data: z.infer<typeof step2Schema>) => {
    setFormData((prev) => ({ ...prev, ...data }))
    setStep(3)
  }

  const onStep3Submit = async (data: z.infer<typeof step3Schema>) => {
    setLoading(true)
    try {
      const allData = { ...formData, ...data }
      let uploadedFiles: string[] = []

      if (files.length > 0) {
        try {
          const parseUploadError = async (res: Response): Promise<string> => {
            const fallback = `HTTP ${res.status}`
            try {
              const payload = await res.json()
              if (payload?.error && typeof payload.error === 'string') return payload.error
            } catch {
              // ignore JSON parse errors
            }
            return fallback
          }

          const uploadBatch = async (batchFiles: File[]): Promise<{ files: string[]; skipped: string[]; error?: string }> => {
            const fd = new FormData()
            fd.append('uploadId', crypto.randomUUID())
            batchFiles.forEach((f) => fd.append('files', f))
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
            if (!uploadRes.ok) {
              return { files: [], skipped: [], error: await parseUploadError(uploadRes) }
            }
            const uploadData = await uploadRes.json()
            return {
              files: uploadData.files || [],
              skipped: uploadData.skipped || [],
            }
          }

          const chunkUploadFile = async (file: File): Promise<{ files: string[]; skipped: string[]; error?: string }> => {
            const CHUNK_SIZE = 256 * 1024
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
            const uploadId = crypto.randomUUID()

            for (let index = 0; index < totalChunks; index++) {
              const start = index * CHUNK_SIZE
              const end = Math.min(start + CHUNK_SIZE, file.size)
              const chunk = file.slice(start, end)

              const fd = new FormData()
              fd.append('uploadId', uploadId)
              fd.append('fileName', file.name)
              fd.append('chunkIndex', String(index))
              fd.append('totalChunks', String(totalChunks))
              fd.append('chunk', chunk, file.name)

              const res = await fetch('/api/upload', { method: 'POST', body: fd })
              if (!res.ok) {
                return { files: [], skipped: [], error: await parseUploadError(res) }
              }

              if (index === totalChunks - 1) {
                const uploadData = await res.json()
                return {
                  files: uploadData.files || [],
                  skipped: uploadData.skipped || [],
                }
              }
            }

            return { files: [], skipped: [], error: 'Не удалось завершить chunk-загрузку' }
          }

          const skippedNames: string[] = []
          const failedNames: string[] = []
          let fallbackError: string | undefined

          for (const file of files) {
            const single = await uploadBatch([file])
            if (single.files.length > 0) {
              uploadedFiles.push(...single.files)
              skippedNames.push(...single.skipped)
              continue
            }

            const errorText = single.error?.toLowerCase() || ''
            const shouldTryChunk =
              errorText.includes('413') ||
              errorText.includes('too large') ||
              errorText.includes('слишком большой') ||
              errorText.includes('payload')

            if (shouldTryChunk) {
              const chunked = await chunkUploadFile(file)
              if (chunked.files.length > 0) {
                uploadedFiles.push(...chunked.files)
                skippedNames.push(...chunked.skipped)
                continue
              }
              failedNames.push(file.name)
              fallbackError = chunked.error || single.error || fallbackError
              continue
            }

            failedNames.push(file.name)
            if (!fallbackError && single.error) fallbackError = single.error
          }

          if (skippedNames.length > 0 || failedNames.length > 0) {
            const parts: string[] = []
            if (skippedNames.length > 0) parts.push(`Пропущены: ${skippedNames.join(', ')}`)
            if (failedNames.length > 0) parts.push(`Не загружены: ${failedNames.join(', ')}`)

            toast({
              title: uploadedFiles.length > 0 ? 'Часть файлов не загружена' : 'Файлы не прикреплены',
              description: `${parts.join('. ')}${fallbackError ? `. Причина: ${fallbackError}` : ''}`,
              variant: 'destructive',
            })
          } else if (uploadedFiles.length === 0) {
            toast({
              title: 'Файлы не прикреплены',
              description: `Не удалось загрузить файлы (${fallbackError || 'неизвестная ошибка'}), но заявка будет отправлена.`,
              variant: 'destructive',
            })
          }
        } catch {
          toast({
            title: 'Файлы не прикреплены',
            description: 'Не удалось загрузить файлы, но заявка будет отправлена.',
            variant: 'destructive',
          })
        }
      }

      // Build estimate snapshot for logging
      const estimatePayload = estimate
        ? {
            label: estimate.label,
            kind: estimate.kind,
            min: estimate.min,
            max: estimate.max,
            confidence: estimate.confidence,
            snapshot: estimate.snapshot,
          }
        : null

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: allData.type,
          subject: allData.subject,
          deadline: allData.deadline,
          description: allData.description,
          name: allData.name,
          email: allData.email,
          phone: allData.phone || null,
          files: uploadedFiles,
          estimatedPrice: estimatePayload,
        }),
      })

      const result = await res.json()
      if (res.ok) {
        setOrderId(result.orderId)
        setSuccess(true)
        if (typeof window !== 'undefined' && (window as Window & { ym?: Function }).ym) {
          (window as Window & { ym?: Function }).ym?.(process.env.NEXT_PUBLIC_METRIKA_ID, 'reachGoal', 'order_submit')
        }
      } else {
        throw new Error(result.error || 'Ошибка отправки')
      }
    } catch (err) {
      console.error(err)
      toast({
        title: 'Ошибка отправки заявки',
        description: (err as Error).message || 'Произошла ошибка. Пожалуйста, попробуйте ещё раз или напишите нам на support@studyassist.ru',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // ─── Derived values ─────────────────────────────────────────────────────────

  const descriptionLength = description.length
  const phoneValue = watch3('phone') || ''

  const formatOrderId = (id: string) => {
    const hash = id.replace(/[^0-9]/g, '').slice(-5).padStart(5, '0')
    return `#${hash}`
  }

  // ─── Success screen ─────────────────────────────────────────────────────────

  if (success) {
    return (
      <section id="order" className="bg-desk dither py-16 sm:py-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            role="status"
            aria-live="polite"
            className="window pixel-shadow text-center"
          >
            <div className="titlebar">
              <span className="flex items-center gap-2 truncate">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                Заявка отправлена
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="titlebar-btn" aria-hidden="true">_</span>
                <span className="titlebar-btn" aria-hidden="true">□</span>
                <span className="titlebar-btn" aria-hidden="true">×</span>
              </div>
            </div>
            <div className="p-8 sm:p-12">
              <div className="bevel-out bg-success w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-white" aria-hidden="true" />
              </div>
              <h3 className="font-display text-xl sm:text-2xl leading-snug text-ink mb-3">Заявка принята!</h3>
              <p className="text-ink-soft mb-4">Ваша заявка успешно отправлена</p>
              <div className="inline-block bevel-in bg-paper px-6 py-3 mb-6">
                <p className="text-ink-soft text-sm">Номер заявки</p>
                <p className="font-mono text-2xl font-bold text-title">{formatOrderId(orderId)}</p>
              </div>
              <p className="text-ink-soft text-sm max-w-md mx-auto">
                Мы свяжемся с вами в течение 30 минут и согласуем детали консультации.
                Проверьте email — там уже ждёт подтверждение заявки.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    )
  }

  // ─── Form render ─────────────────────────────────────────────────────────────

  return (
    <section id="order" className="bg-desk dither py-16 sm:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={revealFrom({ opacity: 0, y: 20 })}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-lg sm:text-2xl leading-snug break-words text-ink mb-3">
            Опиши ситуацию — ответим за 30 минут
          </h2>
          <p className="text-ink/80 text-base md:text-lg">Без регистрации. Без предоплаты. Просто напиши — и мы разберёмся.</p>
        </motion.div>

        <div className="window pixel-shadow">
          <div className="titlebar">
            <span className="flex items-center gap-2 truncate">
              <ClipboardList className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              Новый заказ — шаг {step} из 3
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="titlebar-btn" aria-hidden="true">_</span>
              <span className="titlebar-btn" aria-hidden="true">□</span>
              <span className="titlebar-btn" aria-hidden="true">×</span>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            {/* Progress */}
            <div className="flex items-center justify-between mb-8" role="list" aria-label="Шаги оформления заявки">
              {stepTitles.map((title, i) => (
                <div key={title} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 flex items-center justify-center text-sm font-bold font-mono transition-colors duration-300 ${
                        i + 1 < step
                          ? 'bevel-in bg-success text-white'
                          : i + 1 === step
                          ? 'bevel-out bg-title text-white'
                          : 'bevel-out bg-chrome text-ink-soft'
                      }`}
                    >
                      {i + 1 < step ? <CheckCircle className="w-5 h-5" aria-hidden="true" /> : i + 1}
                    </div>
                    <span className={`text-xs mt-1.5 hidden sm:block text-center transition-colors ${i + 1 === step ? 'text-ink font-semibold' : 'text-ink-soft'}`}>
                      {title}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className={`flex-1 h-[2px] mx-2 transition-colors duration-300 ${i + 1 < step ? 'bg-success' : 'bg-chrome-dark'}`} />
                  )}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
            {/* ── Step 1 ── */}
            {step === 1 && (
              <motion.form
                key="step1"
                initial={revealFrom({ opacity: 0, x: 20 })}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit1(onStep1Submit)}
                className="space-y-5"
              >
                <div>
                  <Label htmlFor="field-type" className="mb-2 block">Тип работы *</Label>
                  <Select onValueChange={(v) => setValue1('type', v as FormData['type'])}>
                    <SelectTrigger id="field-type" aria-describedby={errors1.type ? 'error-type' : undefined} aria-invalid={!!errors1.type}>
                      <SelectValue placeholder="Выберите тип работы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essay">Реферат / эссе</SelectItem>
                      <SelectItem value="coursework">Курсовая работа</SelectItem>
                      <SelectItem value="diploma">ВКР / Дипломная работа</SelectItem>
                      <SelectItem value="lab">Лабораторная / контрольная / практическая</SelectItem>
                      <SelectItem value="presentation">Презентация</SelectItem>
                      <SelectItem value="practice-report">Отчёт по практике</SelectItem>
                      <SelectItem value="uir">УИР (учебно-исследовательская работа)</SelectItem>
                      <SelectItem value="other">Другое</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors1.type && <p id="error-type" role="alert" className="text-danger text-xs mt-1.5 font-medium">{errors1.type.message}</p>}
                </div>

                <div>
                  <Label htmlFor="field-subject" className="mb-2 block">Дисциплина / Предмет *</Label>
                  <Input
                    id="field-subject"
                    {...register1('subject')}
                    aria-describedby={errors1.subject ? 'error-subject' : undefined}
                    aria-invalid={!!errors1.subject}
                    placeholder="Например: Экономика организации, Высшая математика..."
                  />
                  {errors1.subject && <p id="error-subject" role="alert" className="text-danger text-xs mt-1.5 font-medium">{errors1.subject.message}</p>}
                </div>

                <div>
                  <Label htmlFor="field-deadline" className="mb-2 block">Желаемая дата *</Label>
                  <Input
                    id="field-deadline"
                    type="date"
                    {...register1('deadline')}
                    aria-describedby={errors1.deadline ? 'error-deadline' : undefined}
                    aria-invalid={!!errors1.deadline}
                    min={getTomorrowDate()}
                    className="[color-scheme:light]"
                  />
                  {errors1.deadline && <p id="error-deadline" role="alert" className="text-danger text-xs mt-1.5 font-medium">{errors1.deadline.message}</p>}
                </div>

                <Button type="submit" className="w-full gap-2" size="lg">
                  Далее <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.form>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <motion.form
                key="step2"
                initial={revealFrom({ opacity: 0, x: 20 })}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit2(onStep2Submit)}
                className="space-y-5"
              >
                <div>
                  <Label htmlFor="field-description" className="mb-2 block">
                    Подробное описание запроса *
                    <span className={`ml-2 text-xs font-mono ${descriptionLength < 50 ? 'text-ink-soft' : 'text-success'}`} aria-live="polite">
                      {descriptionLength}/50 мин.
                    </span>
                  </Label>
                  <Textarea
                    id="field-description"
                    {...register2('description')}
                    aria-describedby={errors2.description ? 'error-description' : undefined}
                    aria-invalid={!!errors2.description}
                    placeholder="Опишите запрос подробно: какие темы или задачи вызывают затруднение, уровень подготовки, конкретные вопросы. Чем подробнее, тем точнее расчёт стоимости..."
                    rows={6}
                  />
                  {errors2.description && <p id="error-description" role="alert" className="text-danger text-xs mt-1.5 font-medium">{errors2.description.message}</p>}
                </div>

                {/* File upload */}
                <div>
                  <label htmlFor="file-input" className="mb-2 block text-sm font-medium leading-none text-ink">Прикрепить файлы (необязательно)</label>
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    className={`field-95 relative p-6 text-center transition-colors duration-200 cursor-pointer ${
                      dragOver ? 'bg-accent/20' : ''
                    }`}
                    onClick={() => document.getElementById('file-input')?.click()}
                    role="button"
                    aria-label="Загрузить файлы"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && document.getElementById('file-input')?.click()}
                  >
                    <Upload className="w-8 h-8 text-ink-soft mx-auto mb-2" aria-hidden="true" />
                    <p className="text-ink-soft text-sm">
                      Перетащите файлы сюда или <span className="text-title font-semibold">выберите файлы</span>
                    </p>
                    <p className="text-ink-soft/70 text-xs mt-1">
                      {authStatus === 'authenticated'
                        ? 'PDF, DOC, DOCX, TXT, ZIP, JPG, PNG — до 50МБ'
                        : 'Войдите, чтобы прикрепить файлы. Заявку можно отправить без них.'}
                    </p>
                    <input
                      id="file-input"
                      type="file"
                      multiple
                      disabled={authStatus !== 'authenticated'}
                      accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.jpeg,.png,.rar"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </div>

                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file, i) => (
                        <div key={i} className="bevel-out bg-chrome flex items-center justify-between px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <File className="w-4 h-4 text-title flex-shrink-0" aria-hidden="true" />
                            <span className="text-ink text-sm truncate max-w-48">{file.name}</span>
                            <span className="text-ink-soft text-xs flex-shrink-0">({(file.size / 1024 / 1024).toFixed(1)} МБ)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            aria-label={`Удалить файл ${file.name}`}
                            className="text-ink-soft hover:text-danger transition-colors flex-shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-dotted focus-visible:outline-offset-2 focus-visible:outline-ink"
                          >
                            <X className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Price estimate block (step 2) ── */}
                {estimate && (
                  <PriceEstimateBlock estimate={estimate} />
                )}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-2 flex-1">
                    <ChevronLeft className="w-4 h-4" /> Назад
                  </Button>
                  <Button type="submit" className="gap-2 flex-1">
                    Далее <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.form>
            )}

            {/* ── Step 3 ── */}
            {step === 3 && (
              <motion.form
                key="step3"
                initial={revealFrom({ opacity: 0, x: 20 })}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit3(onStep3Submit)}
                className="space-y-5"
              >
                <div>
                  <Label htmlFor="field-name" className="mb-2 block">Ваше имя *</Label>
                  <Input
                    id="field-name"
                    {...register3('name')}
                    aria-describedby={errors3.name ? 'error-name' : undefined}
                    aria-invalid={!!errors3.name}
                    placeholder="Как к вам обращаться?"
                  />
                  {errors3.name && <p id="error-name" role="alert" className="text-danger text-xs mt-1.5 font-medium">{errors3.name.message}</p>}
                </div>

                <div>
                  <Label htmlFor="field-email" className="mb-2 block">Email *</Label>
                  <Input
                    id="field-email"
                    {...register3('email')}
                    type="email"
                    aria-describedby={errors3.email ? 'error-email' : undefined}
                    aria-invalid={!!errors3.email}
                    placeholder="your@email.ru"
                  />
                  {errors3.email && <p id="error-email" role="alert" className="text-danger text-xs mt-1.5 font-medium">{errors3.email.message}</p>}
                </div>

                <div>
                  <Label className="mb-2 block">Телефон или Telegram (необязательно)</Label>
                  <Input
                    value={phoneValue}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val.startsWith('@') || val === '') {
                        setValue3('phone', val)
                      } else {
                        setValue3('phone', formatPhoneInput(val))
                      }
                    }}
                    placeholder="+7 999 ... или @username"
                    type="text"
                  />
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="consent"
                    {...register3('consent')}
                    className="mt-1 w-[18px] h-[18px] border border-chrome-shadow bg-paper accent-title cursor-pointer flex-shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-dotted focus-visible:outline-offset-2 focus-visible:outline-ink"
                  />
                  <label htmlFor="consent" className="text-ink-soft text-sm cursor-pointer leading-relaxed">
                    Я даю согласие на обработку моих персональных данных (ФИО, email, телефон) в целях
                    обработки заявки и связи по её исполнению в соответствии с{' '}
                    <a href="/privacy" className="text-title font-semibold hover:underline">
                      Политикой конфиденциальности
                    </a>.
                    {' '}Согласие можно отозвать, написав на{' '}
                    <a href="mailto:support@studyassist.ru" className="text-title font-semibold hover:underline">
                      support@studyassist.ru
                    </a>
                  </label>
                </div>
                {errors3.consent && <p role="alert" className="text-danger text-xs font-medium">{errors3.consent.message}</p>}

                {/* ── Compact price summary (step 3) ── */}
                {estimate && (
                  <div className="space-y-2">
                    {/* Order summary line */}
                    <div className="bevel-in bg-paper px-4 py-3 text-sm text-ink-soft space-y-1.5">
                      <div className="flex justify-between gap-2">
                        <span>Тип работы</span>
                        <span className="text-ink font-medium text-right">
                          {formData.type ? WORK_TYPE_LABELS[formData.type as WorkType] : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>Предмет</span>
                        <span className="text-ink font-medium truncate max-w-[55%] text-right">{formData.subject || '—'}</span>
                      </div>
                    </div>

                    {/* Compact price */}
                    <PriceEstimateBlock estimate={estimate} compact />

                    {/* Disclaimer */}
                    <p className="text-xs text-ink-soft flex items-start gap-1.5 leading-snug">
                      <Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-ink-soft" aria-hidden="true" />
                      Цена ориентировочная. После изучения всех условий задания итоговая стоимость может
                      быть уточнена — как в большую, так и в меньшую сторону.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="gap-2 flex-1">
                    <ChevronLeft className="w-4 h-4" /> Назад
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="gap-2 flex-1"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Отправляем...
                      </>
                    ) : (
                      'Отправить заявку'
                    )}
                  </Button>
                </div>
              </motion.form>
            )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
