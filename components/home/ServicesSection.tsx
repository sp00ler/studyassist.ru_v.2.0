'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FileText, BookOpen, GraduationCap, Zap, PresentationIcon, ClipboardList, FlaskConical, Sparkles } from 'lucide-react'

const services = [
  {
    icon: FileText,
    title: 'Реферат и эссе',
    description: 'Поможем структурировать, подобрать источники и оформить по требованиям вуза. Быстро и без лишней воды.',
    price: 'от 1 000 ₽',
    color: '#6C3EF4',
    gradient: 'from-purple-500/20 to-purple-900/10',
    badge: null,
    ghost: false,
  },
  {
    icon: BookOpen,
    title: 'Курсовая работа',
    description: 'Сопровождение от плана до готовой работы: теория, практика, оформление по ГОСТ. Сдаётся в срок.',
    price: 'от 3 500 ₽',
    color: '#3B82F6',
    gradient: 'from-blue-500/20 to-blue-900/10',
    badge: null,
    ghost: false,
  },
  {
    icon: GraduationCap,
    title: 'ВКР и дипломная работа',
    description: 'Полное сопровождение: структура, литобзор, практическая часть, оформление, подготовка к защите. Финишная прямая — пройдём вместе.',
    price: 'от 15 000 ₽',
    color: '#8B5CF6',
    gradient: 'from-violet-500/20 to-violet-900/10',
    badge: 'Серьёзная задача',
    badgeColor: '#8B5CF6',
    ghost: false,
  },
  {
    icon: Zap,
    title: 'Лабораторные, контрольные, практические',
    description: 'Горит задание — закроем быстро. Любой предмет, оформление по требованиям кафедры.',
    price: 'от 1 000 ₽/задание',
    color: '#F59E0B',
    gradient: 'from-amber-500/20 to-amber-900/10',
    badge: 'Популярно',
    badgeColor: '#F59E0B',
    ghost: false,
  },
  {
    icon: PresentationIcon,
    title: 'Презентации',
    description: 'Аккуратные слайды для защиты или доклада. Без шаблонных тем, перегруженных слайдов и мелкого шрифта.',
    price: 'от 1 200 ₽',
    color: '#06B6D4',
    gradient: 'from-cyan-500/20 to-cyan-900/10',
    badge: null,
    ghost: false,
  },
  {
    icon: ClipboardList,
    title: 'Отчёт по практике',
    description: 'Поможем структурировать материал и оформить отчёт по стандартам вуза. Дневник практики — тоже можем.',
    price: 'от 5 000 ₽',
    color: '#10B981',
    gradient: 'from-emerald-500/20 to-emerald-900/10',
    badge: null,
    ghost: false,
  },
  {
    icon: FlaskConical,
    title: 'УИР (учебно-исследовательская работа)',
    description: 'Постановка задачи, методология, анализ, выводы — в точном соответствии с требованиями кафедры.',
    price: 'от 7 000 ₽',
    color: '#EC4899',
    gradient: 'from-pink-500/20 to-pink-900/10',
    badge: null,
    ghost: false,
  },
  {
    icon: Sparkles,
    title: 'Другой тип работы',
    description: 'Не нашёл своё в списке? Напиши — уточним детали и назовём цену. Берёмся за нестандартные задачи.',
    price: 'по договорённости',
    color: '#64748B',
    gradient: 'from-slate-500/10 to-slate-900/5',
    badge: null,
    ghost: true,
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
            Любой тип работы — от реферата до диплома. Называем цену до начала, не пропадаем в процессе.
          </p>
        </motion.div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 list-none">
          {services.map((service, index) => (
            <motion.li
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              whileHover={{ y: -4 }}
              className={`group relative overflow-hidden border rounded-2xl p-5 transition-all duration-300 cursor-pointer ${
                service.ghost
                  ? 'bg-white/3 border-white/8 hover:border-white/15'
                  : 'bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/20'
              }`}
            >
              {/* Badge */}
              {service.badge && (
                <div className="absolute top-3 right-3">
                  <span
                    className="text-white text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${service.badgeColor}30`, border: `1px solid ${service.badgeColor}50`, color: service.badgeColor }}
                  >
                    {service.badge}
                  </span>
                </div>
              )}

              {/* Background gradient on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              {/* Icon */}
              <div
                className="relative w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${service.color}20`, border: `1px solid ${service.color}40` }}
              >
                <service.icon className="w-5 h-5" style={{ color: service.color }} />
              </div>

              <div className="relative">
                <h3 className="text-sm font-bold text-white mb-2 leading-snug group-hover:text-white transition-colors">
                  {service.title}
                </h3>
                <p className="text-white/50 text-xs leading-relaxed mb-4">
                  {service.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ color: service.color }}>
                    {service.price}
                  </span>
                  <Link href="#order">
                    <span
                      className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all duration-200 hover:opacity-80"
                      style={{ backgroundColor: `${service.color}20`, color: service.color, border: `1px solid ${service.color}30` }}
                    >
                      {service.ghost ? 'Написать нам' : 'Заявка'}
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
