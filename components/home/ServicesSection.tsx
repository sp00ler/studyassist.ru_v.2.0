'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { BookOpen, GraduationCap, FileText, FlaskConical, PresentationIcon, MoreHorizontal } from 'lucide-react'

const services = [
  {
    icon: BookOpen,
    title: 'Объясним то, что непонятно — один раз и нормально',
    description: 'Без пересказа учебника. Разбираем конкретно твою ситуацию: задачу, тему, вопрос. Математика, экономика, право, IT — любой предмет.',
    price: 'от 800 ₽/час',
    color: '#6C3EF4',
    gradient: 'from-purple-500/20 to-purple-900/10',
    popular: false,
  },
  {
    icon: GraduationCap,
    title: 'Сложная тема? Станет простой',
    description: 'Объясним так, чтобы реально дошло — с примерами, по-человечески, в удобном темпе. Без снисхождения и лишних слов.',
    price: 'от 1 000 ₽/сессию',
    color: '#3B82F6',
    gradient: 'from-blue-500/20 to-blue-900/10',
    popular: false,
  },
  {
    icon: FileText,
    title: 'Не трать часы на поиски',
    description: 'Найдём актуальные источники, учебники и нормативку по твоей теме. Сэкономишь время на то, что действительно важно.',
    price: 'от 500 ₽',
    color: '#8B5CF6',
    gradient: 'from-violet-500/20 to-violet-900/10',
    popular: false,
  },
  {
    icon: FlaskConical,
    title: 'Покажем, как решать — не просто дадим ответ',
    description: 'Пошагово, с объяснением логики. После — сможешь решить похожее сам. Математика, физика, программирование, химия.',
    price: 'от 600 ₽/задача',
    color: '#06B6D4',
    gradient: 'from-cyan-500/20 to-cyan-900/10',
    popular: false,
  },
  {
    icon: PresentationIcon,
    title: 'Сдай, а не просто дойди до аудитории',
    description: 'Систематизируем материал, проработаем типовые вопросы, разберём стратегию поведения на экзамене. Паника — не лучший помощник.',
    price: 'от 1 000 ₽',
    color: '#F59E0B',
    gradient: 'from-amber-500/20 to-amber-900/10',
    popular: true,
  },
  {
    icon: MoreHorizontal,
    title: 'Проверим до того, как проверит преподаватель',
    description: 'Укажем на слабые места в структуре, логике и содержании. Лучше узнать сейчас — чем услышать это на защите или зачёте.',
    price: 'от 700 ₽',
    color: '#10B981',
    gradient: 'from-emerald-500/20 to-emerald-900/10',
    popular: false,
  },
]

export function ServicesSection() {
  return (
    <section id="services" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Что конкретно{' '}
            <span className="bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] bg-clip-text text-transparent">
              мы делаем
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Не просто объясняем — даём инструменты, которые работают
          </p>
        </motion.div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none">
          {services.map((service, index) => (
            <motion.li
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 cursor-pointer"
            >
              {/* Popular badge */}
              {service.popular && (
                <div className="absolute top-4 right-4">
                  <span className="bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    Популярно
                  </span>
                </div>
              )}

              {/* Background gradient on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              {/* Icon */}
              <div
                className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${service.color}20`, border: `1px solid ${service.color}40` }}
              >
                <service.icon className="w-6 h-6" style={{ color: service.color }} />
              </div>

              <div className="relative">
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-white transition-colors">
                  {service.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed mb-4">
                  {service.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold" style={{ color: service.color }}>
                    {service.price}
                  </span>
                  <Link href="#order">
                    <span
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 hover:opacity-80"
                      style={{ backgroundColor: `${service.color}20`, color: service.color, border: `1px solid ${service.color}30` }}
                    >
                      Оставить заявку
                    </span>
                  </Link>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
