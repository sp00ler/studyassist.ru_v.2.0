import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { Mail, Clock, Phone, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Контакты — StudyAssist',
  description: 'Свяжитесь с командой StudyAssist: email, Telegram и время работы поддержки. Ответим в течение 30 минут.',
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  )
}

function VKIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.525-2.049-1.714-1.033-1.01-1.49-.56-1.49.56v1.154c0 .336-.16.56-.742.56-2.703 0-4.762-1.677-6.117-4.024C5.65 11.1 5.25 9.086 5.25 8.316c0-.392.12-.68.534-.68h1.744c.436 0 .604.154.762.582.83 2.508 2.22 4.704 2.793 4.704.217 0 .317-.1.317-.647V10.59c-.067-1.163-.682-1.26-.682-1.674 0-.218.18-.435.46-.435h2.743c.37 0 .497.196.497.626v3.364c0 .37.163.497.264.497.218 0 .397-.127.793-.523 1.23-1.376 2.103-3.494 2.103-3.494.12-.244.32-.47.758-.47h1.744c.524 0 .638.27.524.636-.218.977-2.302 3.944-2.302 3.944-.182.297-.247.428 0 .76.182.247.78.76 1.177 1.22.74.843 1.306 1.554 1.459 2.044.136.46-.08.693-.545.693z"/>
    </svg>
  )
}

function MaxIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720" fill="currentColor" className="w-6 h-6">
      <path d="M350.4,9.6C141.8,20.5,4.1,184.1,12.8,390.4c3.8,90.3,40.1,168,48.7,253.7,2.2,22.2-4.2,49.6,21.4,59.3,31.5,11.9,79.8-8.1,106.2-26.4,9-6.1,17.6-13.2,24.2-22,27.3,18.1,53.2,35.6,85.7,43.4,143.1,34.3,299.9-44.2,369.6-170.3C799.6,291.2,622.5-4.6,350.4,9.6h0ZM269.4,504c-11.3,8.8-22.2,20.8-34.7,27.7-18.1,9.7-23.7-.4-30.5-16.4-21.4-50.9-24-137.6-11.5-190.9,16.8-72.5,72.9-136.3,150-143.1,78-6.9,150.4,32.7,183.1,104.2,72.4,159.1-112.9,316.2-256.4,218.6h0Z"/>
    </svg>
  )
}

const contacts = [
  {
    label: 'Email',
    value: 'support@studyassist.ru',
    href: 'mailto:support@studyassist.ru',
    bg: 'bg-[#6C3EF4]/20',
    iconColor: 'text-[#6C3EF4]',
    icon: <Mail className="w-6 h-6" />,
  },
  {
    label: 'Telegram',
    value: '@studyAssist_support',
    href: 'https://t.me/studyAssist_support',
    bg: 'bg-[#29A8EB]/20',
    iconColor: 'text-[#29A8EB]',
    icon: <TelegramIcon />,
  },
  {
    label: 'WhatsApp',
    value: '+7 953 924-68-17',
    href: 'https://wa.me/79539246817',
    bg: 'bg-[#25D366]/20',
    iconColor: 'text-[#25D366]',
    icon: <WhatsAppIcon />,
  },
  {
    label: 'ВКонтакте',
    value: 'vk.ru/supp0rt_studyassist',
    href: 'https://vk.ru/supp0rt_studyassist',
    bg: 'bg-[#0077FF]/20',
    iconColor: 'text-[#0077FF]',
    icon: <VKIcon />,
  },
  {
    label: 'Мессенджер Макс',
    value: 'Написать в Макс',
    href: 'https://max.ru/u/f9LHodD0cOKKqte1G0iOkuvcpOxTcT_Ij63H_NRW1G01Mzd5cDnBJdmEom8',
    bg: 'bg-[#FF6600]/20',
    iconColor: 'text-[#FF6600]',
    icon: <MaxIcon />,
  },
  {
    label: 'Телефон',
    value: '+7 953 924-68-17',
    href: 'tel:+79539246817',
    bg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    icon: <Phone className="w-6 h-6" />,
  },
]

export default function ContactsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm mb-8">
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Контакты</h1>
          <p className="text-white/50 mb-8">Свяжитесь с нами любым удобным способом — ответим в течение 30 минут.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith('http') ? '_blank' : undefined}
                rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/8 transition-all duration-200 group flex items-start gap-4"
              >
                <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0 ${c.iconColor} group-hover:scale-110 transition-transform duration-200`}>
                  {c.icon}
                </div>
                <div>
                  <p className="text-white/50 text-sm mb-1">{c.label}</p>
                  <p className={`font-semibold ${c.iconColor} group-hover:underline`}>{c.value}</p>
                </div>
              </a>
            ))}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-start gap-4 md:col-span-2">
              <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-xl flex items-center justify-center flex-shrink-0 text-[#3B82F6]">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white/50 text-sm mb-1">Режим работы</p>
                <p className="text-white font-semibold">Ежедневно с 9:00 до 23:00 МСК</p>
                <p className="text-white/40 text-sm mt-1">Ответ в течение 30 минут</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
