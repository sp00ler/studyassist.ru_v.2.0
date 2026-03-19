import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Запуск seed...')

  // ─────────────────────────────────────────
  // 1. Admin user
  // ─────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash('admin123!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@studyassist.ru' },
    update: {},
    create: {
      email: 'admin@studyassist.ru',
      name: 'Администратор',
      passwordHash: adminPasswordHash,
      isAdmin: true,
      provider: 'credentials',
    },
  })
  console.log('✅ Admin user:', admin.email)

  // ─────────────────────────────────────────
  // 2. Test users
  // ─────────────────────────────────────────
  const testUsers = [
    { name: 'Анна Петрова', email: 'anna@test.ru', phone: '+7 901 234-56-78' },
    { name: 'Дмитрий Соколов', email: 'dmitry@test.ru', phone: '+7 902 345-67-89' },
    { name: 'Мария Иванова', email: 'maria@test.ru', phone: '+7 903 456-78-90' },
    { name: 'Алексей Смирнов', email: 'alexey@test.ru', phone: null },
    { name: 'Екатерина Новикова', email: 'kate@test.ru', phone: '+7 905 678-90-12' },
  ]

  const passwordHash = await bcrypt.hash('test123', 10)
  const createdUsers = []

  for (const u of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        phone: u.phone,
        passwordHash,
        provider: 'credentials',
      },
    })
    createdUsers.push(user)
    console.log(`✅ User: ${user.email}`)
  }

  // ─────────────────────────────────────────
  // 3. Test orders
  // ─────────────────────────────────────────
  const now = new Date()
  const ordersData = [
    {
      userId: createdUsers[0].id,
      type: 'coursework',
      subject: 'Экономика организации',
      deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      description: 'Необходимо написать курсовую работу по экономике организации. Тема: "Анализ финансового состояния предприятия". Объём 40-50 страниц. Требуется практическая часть с расчётами на примере реального предприятия. Оформление по ГОСТ.',
      status: 'new',
      price: null,
    },
    {
      userId: createdUsers[1].id,
      type: 'lab',
      subject: 'Программирование на Python',
      deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      description: 'Лабораторная работа по Python. Задача: реализовать алгоритм сортировки слиянием, написать тесты, оформить отчёт. Подробное ТЗ прикреплено. Срочно нужно, через 3 дня сдача.',
      status: 'in_progress',
      price: 1200,
    },
    {
      userId: createdUsers[2].id,
      type: 'diploma',
      subject: 'Менеджмент организации',
      deadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      description: 'Дипломная работа (ВКР) по специальности менеджмент. Тема: "Совершенствование системы управления персоналом на предприятии". Объём 70-80 страниц. Нормоконтроль обязателен. Нужна презентация.',
      status: 'ready_for_review',
      price: 9500,
    },
    {
      userId: createdUsers[3].id,
      type: 'essay',
      subject: 'История России',
      deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      description: 'Реферат на тему "Реформы Петра I и их значение для России". Объём 15-20 страниц. Уникальность 80%+. Список литературы минимум 10 источников.',
      status: 'awaiting_payment',
      price: 800,
      paymentLink: null,
    },
    {
      userId: createdUsers[4].id,
      type: 'presentation',
      subject: 'Маркетинг',
      deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      description: 'Презентация по теме "Цифровой маркетинг в 2024 году". 15-20 слайдов в PowerPoint. Нужен современный дизайн, инфографика. Также нужен текст доклада на 5 минут.',
      status: 'paid',
      price: 1500,
    },
    {
      userId: createdUsers[0].id,
      type: 'coursework',
      subject: 'Финансовый менеджмент',
      deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      description: 'Курсовая работа по финансовому менеджменту. Тема: "Оценка инвестиционного проекта". Нужны расчёты NPV, IRR, срок окупаемости. Объём 35-45 страниц с практической частью.',
      status: 'completed',
      price: 2800,
    },
    {
      userId: createdUsers[1].id,
      type: 'lab',
      subject: 'Физика',
      deadline: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      description: 'Лабораторная работа по физике. Изучение закона Ома для полной цепи. Обработка результатов эксперимента, построение графиков, выводы.',
      status: 'cancelled',
      price: null,
    },
    {
      userId: createdUsers[2].id,
      type: 'other',
      subject: 'Иностранный язык (английский)',
      deadline: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      description: 'Нужен перевод технического текста с русского на английский. Объём ~5 страниц. Тематика: промышленное производство. Качественный литературный перевод.',
      status: 'in_progress',
      price: 600,
    },
    {
      userId: createdUsers[3].id,
      type: 'coursework',
      subject: 'Гражданское право',
      deadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      description: 'Курсовая работа по гражданскому праву. Тема: "Договор купли-продажи: понятие, признаки, виды". Нужен анализ судебной практики. Объём 30-40 страниц.',
      status: 'new',
      price: null,
    },
    {
      userId: createdUsers[4].id,
      type: 'essay',
      subject: 'Философия',
      deadline: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      description: 'Эссе по философии на тему "Проблема свободы воли в современной философии". 10-12 страниц. Своё мнение с опорой на работы известных философов.',
      status: 'in_progress',
      price: 750,
    },
    {
      userId: createdUsers[0].id,
      type: 'lab',
      subject: 'Химия',
      deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      description: 'Лабораторный отчёт по органической химии. Синтез эфиров. Описание хода работы, реакции, расчёты выхода продукта.',
      status: 'ready_for_review',
      price: 950,
    },
    {
      userId: createdUsers[1].id,
      type: 'diploma',
      subject: 'Информационные технологии',
      deadline: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
      description: 'ВКР на тему "Разработка веб-приложения для учёта товаров на складе". Stack: React + Node.js + PostgreSQL. Нужна полная документация, тесты, диаграммы.',
      status: 'in_progress',
      price: 15000,
    },
    {
      userId: createdUsers[2].id,
      type: 'presentation',
      subject: 'Экономическая теория',
      deadline: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      description: 'Презентация для защиты курсовой по экономической теории. 12 слайдов. Тема: "Монополия и её виды". Нужен доклад 7-10 минут.',
      status: 'awaiting_payment',
      price: 1100,
    },
  ]

  for (const orderData of ordersData) {
    const order = await prisma.order.create({
      data: orderData,
    })
    console.log(`✅ Order: ${order.id} (${order.type}, ${order.status})`)

    // Создаём платежи для оплаченных заказов
    if (order.status === 'paid' || order.status === 'completed') {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          amount: order.price!,
          status: 'succeeded',
          yukassaId: `test_payment_${order.id.slice(-8)}`,
        },
      })
    }
  }

  // ─────────────────────────────────────────
  // 4. Reviews (5 статических + 3 тестовых)
  // ─────────────────────────────────────────
  const reviews = [
    {
      name: 'Анна К.',
      university: 'МГУ',
      city: 'Москва',
      rating: 5,
      text: 'Сдала курсовую по экономике на отлично! Всё чётко по методичке, никаких правок не потребовалось. Спасибо огромное, буду обращаться ещё.',
      approved: true,
      userId: null,
    },
    {
      name: 'Дмитрий Р.',
      university: 'СПбГУ',
      city: 'Санкт-Петербург',
      rating: 5,
      text: 'Заказывал лабораторные по программированию несколько раз. Каждый раз всё сдаётся с первого раза. Удобно что можно оплатить после того как убедился в качестве.',
      approved: true,
      userId: null,
    },
    {
      name: 'Мария Т.',
      university: 'ТГУ',
      city: 'Тольятти',
      rating: 5,
      text: 'Диплом помогли доработать в последний момент, буквально за 3 дня. Думала уже паника, но ребята взялись и всё сделали как надо. Защитилась на 4.',
      approved: true,
      userId: null,
    },
    {
      name: 'Алексей М.',
      university: 'УрФУ',
      city: 'Екатеринбург',
      rating: 5,
      text: 'Реферат за ночь, да ещё и уникальность 85%. Цена адекватная, связь быстрая. Всё нормально.',
      approved: true,
      userId: null,
    },
    {
      name: 'Екатерина Н.',
      university: 'КФУ',
      city: 'Казань',
      rating: 5,
      text: 'Заказывала презентацию с докладом. Слайды сделали красиво, доклад логичный. Преподаватель похвалил оформление.',
      approved: true,
      userId: null,
    },
    // Pending reviews for testing moderation
    {
      name: createdUsers[0].name!,
      university: 'МГУ',
      city: 'Москва',
      rating: 5,
      text: 'Отличный сервис! Всё быстро и качественно. Рекомендую всем студентам.',
      approved: false,
      userId: createdUsers[0].id,
    },
    {
      name: createdUsers[1].name!,
      university: 'МГТУ',
      city: 'Москва',
      rating: 4,
      text: 'Хорошая работа, небольшая правка была нужна, но исправили быстро.',
      approved: false,
      userId: createdUsers[1].id,
    },
  ]

  for (const review of reviews) {
    const r = await prisma.review.create({ data: review })
    console.log(`✅ Review: ${r.name} (approved: ${r.approved})`)
  }

  console.log('\n🎉 Seed завершён успешно!')
  console.log('📧 Admin: admin@studyassist.ru / admin123!')
  console.log('📧 Test users: anna@test.ru / test123 (и другие)')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
