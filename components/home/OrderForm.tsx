'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, X, CheckCircle, Loader2, ChevronRight, ChevronLeft, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'

// Step 1 schema
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

// Step 2 schema
const step2Schema = z.object({
  description: z.string().min(50, 'Описание должно содержать минимум 50 символов'),
})

// Step 3 schema
const step3Schema = z.object({
  name: z.string().min(2, 'Укажите ваше имя'),
  email: z.string().email('Некорректный email'),
  phone: z.string().optional(),
  consent: z.boolean().refine((v) => v === true, 'Необходимо согласие на обработку данных'),
})

type FormData = z.infer<typeof step1Schema> & z.infer<typeof step2Schema> & z.infer<typeof step3Schema>

const stepTitles = [
  'Тип услуги',
  'Описание запроса',
  'Контактные данные',
]

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

export function OrderForm() {
  const { toast } = useToast()
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles((prev) => [...prev, ...droppedFiles].slice(0, 10))
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...selected].slice(0, 10))
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

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

      // Временный ID для загрузки файлов
      const tempId = `temp_${Date.now()}`

      // Загружаем файлы если есть
      if (files.length > 0) {
        try {
          const fd = new FormData()
          fd.append('orderId', tempId)
          files.forEach((f) => fd.append('files', f))
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            uploadedFiles = uploadData.files || []
            if (uploadData.skipped && uploadData.skipped.length > 0) {
              toast({
                title: 'Часть файлов не загружена',
                description: `Файлы с неподдерживаемым типом пропущены: ${uploadData.skipped.join(', ')}`,
                variant: 'destructive',
              })
            }
          } else {
            // Файлы не загрузились — не блокируем заявку, отправляем без файлов
            toast({
              title: 'Файлы не прикреплены',
              description: 'Не удалось загрузить файлы, но заявка будет отправлена. Вы сможете прислать файлы в ответном письме.',
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

      // Создаём заявку
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
        }),
      })

      const result = await res.json()
      if (res.ok) {
        setOrderId(result.orderId)
        setSuccess(true)
        // Yandex Metrika goal
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

  const descriptionLength = watch2('description')?.length || 0
  const phoneValue = watch3('phone') || ''
  const consentValue = watch3('consent')

  const formatOrderId = (id: string) => {
    const hash = id.replace(/[^0-9]/g, '').slice(-5).padStart(5, '0')
    return `#${hash}`
  }

  if (success) {
    return (
      <section id="order" className="py-24">
        <div className="max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            role="status"
            aria-live="polite"
            className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center"
          >
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-3">Заявка принята!</h3>
            <p className="text-white/50 mb-4">
              Ваша заявка успешно отправлена
            </p>
            <div className="inline-block bg-[#6C3EF4]/20 border border-[#6C3EF4]/30 rounded-xl px-6 py-3 mb-6">
              <p className="text-white/70 text-sm">Номер заявки</p>
              <p className="text-2xl font-bold text-[#A78BFA]">{formatOrderId(orderId)}</p>
            </div>
            <p className="text-white/50 text-sm">
              Мы свяжемся с вами в течение 30 минут и согласуем детали консультации.
              Проверьте email — там уже ждёт подтверждение заявки.
            </p>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section id="order" className="py-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Опиши ситуацию —{' '}
            <span className="bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] bg-clip-text text-transparent">
              ответим за 30 минут
            </span>
          </h2>
          <p className="text-white/50">Без регистрации. Без предоплаты. Просто напиши — и мы разберёмся.</p>
        </motion.div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
          {/* Progress */}
          <div className="flex items-center justify-between mb-8">
            {stepTitles.map((title, i) => (
              <div key={title} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      i + 1 < step
                        ? 'bg-emerald-500 text-white'
                        : i + 1 === step
                        ? 'bg-gradient-to-br from-[#6C3EF4] to-[#3B82F6] text-white'
                        : 'bg-white/10 text-white/30'
                    }`}
                  >
                    {i + 1 < step ? <CheckCircle className="w-5 h-5" /> : i + 1}
                  </div>
                  <span className={`text-xs mt-1 hidden sm:block transition-colors ${i + 1 === step ? 'text-white' : 'text-white/30'}`}>
                    {title}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-px mx-2 transition-all duration-300 ${i + 1 < step ? 'bg-emerald-500' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1 */}
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: 20 }}
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
                      <SelectValue placeholder="Выберите тип услуги" />
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
                  {errors1.type && <p id="error-type" role="alert" className="text-red-400 text-xs mt-1">{errors1.type.message}</p>}
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
                  {errors1.subject && <p id="error-subject" role="alert" className="text-red-400 text-xs mt-1">{errors1.subject.message}</p>}
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
                    className="[color-scheme:dark]"
                  />
                  {errors1.deadline && <p id="error-deadline" role="alert" className="text-red-400 text-xs mt-1">{errors1.deadline.message}</p>}
                </div>

                <Button type="submit" className="w-full gap-2" size="lg">
                  Далее <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.form>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit2(onStep2Submit)}
                className="space-y-5"
              >
                <div>
                  <Label htmlFor="field-description" className="mb-2 block">
                    Подробное описание запроса *
                    <span className={`ml-2 text-xs ${descriptionLength < 50 ? 'text-white/30' : 'text-emerald-400'}`} aria-live="polite">
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
                  {errors2.description && <p id="error-description" role="alert" className="text-red-400 text-xs mt-1">{errors2.description.message}</p>}
                </div>

                {/* File upload */}
                <div>
                  <label htmlFor="file-input" className="mb-2 block text-sm font-medium leading-none">Прикрепить файлы (необязательно)</label>
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer ${
                      dragOver ? 'border-[#6C3EF4] bg-[#6C3EF4]/10' : 'border-white/10 hover:border-white/20 bg-white/3'
                    }`}
                    onClick={() => document.getElementById('file-input')?.click()}
                    role="button"
                    aria-label="Загрузить файлы"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && document.getElementById('file-input')?.click()}
                  >
                    <Upload className="w-8 h-8 text-white/30 mx-auto mb-2" aria-hidden="true" />
                    <p className="text-white/50 text-sm">
                      Перетащите файлы сюда или <span className="text-[#6C3EF4]">выберите файлы</span>
                    </p>
                    <p className="text-white/30 text-xs mt-1">PDF, DOC, DOCX, TXT, ZIP, JPG, PNG — до 50МБ</p>
                    <input
                      id="file-input"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.jpeg,.png,.rar"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </div>

                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <File className="w-4 h-4 text-[#6C3EF4]" />
                            <span className="text-white/70 text-sm truncate max-w-48">{file.name}</span>
                            <span className="text-white/30 text-xs">({(file.size / 1024 / 1024).toFixed(1)} МБ)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            aria-label={`Удалить файл ${file.name}`}
                            className="text-white/30 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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

            {/* Step 3 */}
            {step === 3 && (
              <motion.form
                key="step3"
                initial={{ opacity: 0, x: 20 }}
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
                  {errors3.name && <p id="error-name" role="alert" className="text-red-400 text-xs mt-1">{errors3.name.message}</p>}
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
                  {errors3.email && <p id="error-email" role="alert" className="text-red-400 text-xs mt-1">{errors3.email.message}</p>}
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
                    className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-[#6C3EF4] cursor-pointer accent-[#6C3EF4] flex-shrink-0"
                  />
                  <label htmlFor="consent" className="text-white/50 text-sm cursor-pointer">
                    Я даю согласие на обработку моих персональных данных (ФИО, email, телефон) в целях
                    обработки заявки и связи по её исполнению в соответствии с{' '}
                    <a href="/privacy" className="text-[#6C3EF4] hover:underline">
                      Политикой конфиденциальности
                    </a>.
                    {' '}Согласие можно отозвать, написав на{' '}
                    <a href="mailto:support@studyassist.ru" className="text-[#6C3EF4] hover:underline">
                      support@studyassist.ru
                    </a>
                  </label>
                </div>
                {errors3.consent && <p className="text-red-400 text-xs">{errors3.consent.message}</p>}

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
    </section>
  )
}
