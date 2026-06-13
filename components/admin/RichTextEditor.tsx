'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { useEffect } from 'react'
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Minus, Link2, Undo, Redo,
} from 'lucide-react'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Начните писать...',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-[#C5FF45] underline' },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose-sa outline-none min-h-[320px] px-1',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  // Sync external value changes (e.g. when loading saved post)
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) return null

  const btn = (active: boolean) =>
    `p-1.5 rounded-lg transition-colors ${active ? 'bg-[#C5FF45]/20 text-[#C5FF45]' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`

  const setLink = () => {
    const prev = editor.getAttributes('link').href
    const url = window.prompt('URL ссылки:', prev)
    if (url === null) return
    if (url === '') { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div className="bg-[#07070E] border border-white/10 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-white/10 flex-wrap">
        <button type="button" className={btn(editor.isActive('bold'))}
          onClick={() => editor.chain().focus().toggleBold().run()} title="Жирный">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" className={btn(editor.isActive('italic'))}
          onClick={() => editor.chain().focus().toggleItalic().run()} title="Курсив">
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <button type="button" className={btn(editor.isActive('heading', { level: 2 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Заголовок H2">
          <Heading2 className="w-4 h-4" />
        </button>
        <button type="button" className={btn(editor.isActive('heading', { level: 3 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Заголовок H3">
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <button type="button" className={btn(editor.isActive('bulletList'))}
          onClick={() => editor.chain().focus().toggleBulletList().run()} title="Список">
          <List className="w-4 h-4" />
        </button>
        <button type="button" className={btn(editor.isActive('orderedList'))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Нумерованный список">
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <button type="button" className={btn(editor.isActive('blockquote'))}
          onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Цитата">
          <Quote className="w-4 h-4" />
        </button>
        <button type="button" className={btn(editor.isActive('code'))}
          onClick={() => editor.chain().focus().toggleCode().run()} title="Код">
          <Code className="w-4 h-4" />
        </button>
        <button type="button" className={btn(false)}
          onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Разделитель">
          <Minus className="w-4 h-4" />
        </button>
        <button type="button" className={btn(editor.isActive('link'))}
          onClick={setLink} title="Ссылка">
          <Link2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <button type="button" className={btn(false)}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()} title="Отменить">
          <Undo className="w-4 h-4" />
        </button>
        <button type="button" className={btn(false)}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()} title="Повторить">
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Editor area */}
      <div className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
