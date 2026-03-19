'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { BookOpen, GraduationCap, FileText, FlaskConical, PresentationIcon, MoreHorizontal } from 'lucide-react'

const services = [
  {
    icon: BookOpen,
    title: 'Курсовые работы',
    description: 'Теоретическая и практическая части, список литературы, оформление по ГОСТ.',
    price: 'от 1 500 ₽',
    color: '#6C3EF4',
    gradient: 'from-purple-500/20 to-purple-900/10',
  },
  {
    icon: GraduationCap,
    title: 'Дипломные работы (ВКР)',
    description: 'Полный объём 60-100 страниц, нормоконтроль, презентация, защитная речь.',
    price: 'от 7 000 ₽',
    color: '#3B82F6',
    gradient: 'from-blue-500/20 to-blue-900/10',
  },
  {
    icon: FileText,
    title: 'Рефераты и эссе',
    description: 'Качественная аналитика, уникальность от 80%, оформление по требованиям.',
    price: 'от 500 ₽',
    color: '#8B5CF6',
    gradient: 'from-violet-500/20 to-violet-900/10',
  },
  {
    icon: FlaskConical,
    title: 'Лабораторные и задачи',
    description: 'Решение задач, написание кода, расчёты, анализ данных по любым предметам.',
    price: 'от 800 ₽',
    color: '#06B6D4',
    gradient: 'from-cyan-500/20 to-cyan-900/10',
  },
  {
    icon: PresentationIcon,
    title: 'Презентации и отчёты',
    description: 'Профессиональный дизайн, структурированный контент, доклад к защите.',
    price: 'от 700 ₽',
    color: '#F59E0B',
    gradient: 'from-amber-500/20 to-amber-900/10',
  },
  {
    icon: MoreHorizontal,
    title: 'Любые другие задания',
    description: 'Контрольные работы, тесты, ответы на вопросы, переводы и многое другое.',
    price: 'По договорённости',
    color: '#10B981',
    gradient: 'from-emerald-500/20 to-emerald-900/10',
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
            Наши{' '}
            <span className="bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] bg-clip-text text-transparent">
              услуги
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Помогаем со всеми видами учебных работ — от реферата до диплома
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 cursor-pointer"
            >
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
                      Заказать
                    </span>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
