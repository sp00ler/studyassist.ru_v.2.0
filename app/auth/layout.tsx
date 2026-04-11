import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Вход и регистрация — StudyAssist',
  description: 'Войдите или создайте аккаунт на StudyAssist, чтобы получить профессиональную помощь в учёбе: консультации, подбор материалов, подготовка к экзаменам.',
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
