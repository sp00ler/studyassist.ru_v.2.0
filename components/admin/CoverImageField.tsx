'use client'

import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export function CoverImageField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/admin/posts/cover', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки')
      onChange(data.url)
      toast({ title: 'Обложка загружена' })
    } catch (e) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <Label className="mb-2 block">Обложка (необязательно)</Label>
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Загрузите файл или вставьте URL" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-95 flex items-center gap-2 px-3 py-2 text-[11px] font-display whitespace-nowrap"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          С компьютера
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')} className="btn-95 px-2" title="Убрать обложку">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <p className="text-xs text-ink-soft mt-1">PNG, JPG или WebP, до 5 МБ.</p>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="mt-3 max-h-48 border border-chrome-shadow/30" />
      )}
    </div>
  )
}
