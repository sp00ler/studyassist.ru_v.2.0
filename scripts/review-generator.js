// scripts/review-generator.js
// Generates 1-2 auto-approved reviews daily and writes them to the DB.
// Run via PM2 cron: pm2 start scripts/review-generator.js --name review-gen --cron "0 10 * * *" --no-autorestart
const path = require('path')
const fs = require('fs')
const { PrismaClient } = require('@prisma/client')

function loadEnv(filePath) {
  try {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n')
    for (const line of lines) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (!match) continue
      const key = match[1]
      let value = match[2].trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    }
  } catch (err) {
    console.error('[review-gen] loadEnv error:', err.message)
  }
}

loadEnv(path.join(__dirname, '..', '.env'))

const prisma = new PrismaClient()

const FEMALE_NAMES = ['Анастасия', 'Валерия', 'Дарья', 'Екатерина', 'Ирина', 'Кристина', 'Мария', 'Наталья', 'Ольга', 'Полина', 'Светлана', 'Татьяна', 'Юлия', 'Алина', 'Виктория', 'Лидия', 'Нина', 'Галина', 'Жанна', 'Инна']
const MALE_NAMES = ['Александр', 'Алексей', 'Андрей', 'Артём', 'Дмитрий', 'Иван', 'Кирилл', 'Максим', 'Михаил', 'Никита', 'Павел', 'Роман', 'Сергей', 'Владимир', 'Евгений', 'Игорь', 'Олег', 'Пётр', 'Руслан', 'Тимур']
const LAST_INITIALS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'Ф', 'Ш', 'Я']
const CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Новосибирск', 'Нижний Новгород', 'Самара', 'Ростов-на-Дону', 'Уфа', 'Пермь', 'Омск', 'Красноярск', 'Воронеж', 'Волгоград', 'Краснодар']
const UNIVERSITIES = ['МГУ', 'НИУ ВШЭ', 'МГТУ им. Баумана', 'РЭУ им. Плеханова', 'РУДН', 'СПбГУ', 'КФУ', 'ТГУ', 'УрФУ', 'ВГУ', 'ННГУ', 'СамГУ', 'УГАТУ', 'КубГУ', 'ОмГУ']
const SUBJECTS = ['экономике', 'менеджменту', 'маркетингу', 'юриспруденции', 'психологии', 'педагогике', 'информационным технологиям', 'финансам', 'бухгалтерскому учёту', 'математике', 'физике', 'истории', 'философии', 'социологии', 'архитектуре', 'строительству', 'медицине', 'биологии', 'химии', 'праву']
const WORK_LABELS = [
  { acc: 'курсовую', nom: 'Курсовая' },
  { acc: 'диплом', nom: 'Диплом' },
  { acc: 'реферат', nom: 'Реферат' },
  { acc: 'отчёт по практике', nom: 'Отчёт по практике' },
  { acc: 'лабораторную работу', nom: 'Лабораторная' },
  { acc: 'контрольную работу', nom: 'Контрольная' },
  { acc: 'презентацию', nom: 'Презентация' },
]
const GRADES = ['пять', 'отлично', '5', '«отлично»', 'четыре', '4']

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildText(work, subject, isFemale) {
  const g = isFemale
  const templates = [
    () => `Заказ${g ? 'ала' : 'ал'} ${work.acc} по ${subject}. Выполнили точно по методичке, все требования учли. Получил${g ? 'а' : ''} ${pick(GRADES)}.`,
    () => `Обратил${g ? 'ась' : 'ся'} с ${work.acc} в последний момент — дедлайн был через двое суток. Сделали, сдал${g ? 'а' : ''} на ${pick(GRADES)}. Рекомендую.`,
    () => `${work.nom} по ${subject} — тема оказалась сложнее, чем думал${g ? 'а' : ''}. Помогли разобраться и написали нормально. Оценка ${pick(GRADES)}.`,
    () => `Уже второй раз обращаюсь. ${work.nom} по ${subject} сдал${g ? 'а' : ''} без замечаний. Работают быстро, без лишних вопросов.`,
    () => `Брал${g ? 'а' : ''} ${work.acc} по ${subject}. Преподаватель строгий, но работа прошла проверку. Поставили ${pick(GRADES)}.`,
    () => `Ответили быстро, цену назвали сразу. ${work.nom} по ${subject} сделали раньше срока. Всё аккуратно, по ГОСТу.`,
    () => `Не знал${g ? 'а' : ''} с чего начать ${work.acc} по ${subject}. Объяснили структуру, написали по плану. ${pick(GRADES).charAt(0).toUpperCase() + pick(GRADES).slice(1)} на защите.`,
    () => `Заказывал${g ? 'а' : ''} ${work.acc} по ${subject}. Правки попросил${g ? 'а' : ''} — сделали без доплаты. Приятно работать с честными людьми.`,
    () => `Тема по ${subject} была специфическая, думал${g ? 'а' : ''}, не возьмутся. Взялись, написали грамотно. ${pick(GRADES).charAt(0).toUpperCase() + pick(GRADES).slice(1)}.`,
    () => `Срочный заказ — ${work.acc} по ${subject} за день. Справились. Больше не нервничаю перед сдачей.`,
    () => `${work.nom} по ${subject} — сложная структура, много требований. Всё выполнено аккуратно. Оценка ${pick(GRADES)}.`,
    () => `Нашёл${g ? 'а' : ''} по рекомендации. ${work.nom} по ${subject} написали хорошо, сдал${g ? 'а' : ''} без проблем.`,
  ]
  return pick(templates)()
}

async function generateOne(photoIndex) {
  const isFemale = Math.random() < 0.55
  const firstName = isFemale ? pick(FEMALE_NAMES) : pick(MALE_NAMES)
  const lastName = pick(LAST_INITIALS) + '.'
  const name = `${firstName} ${lastName}`
  const city = pick(CITIES)
  const university = pick(UNIVERSITIES)
  const work = pick(WORK_LABELS)
  const subject = pick(SUBJECTS)
  const text = buildText(work, subject, isFemale)
  const rating = Math.random() < 0.85 ? 5 : 4

  // Every 3rd review gets a real randomuser.me portrait
  let avatar = null
  if (photoIndex % 3 === 2) {
    const gender = isFemale ? 'women' : 'men'
    const num = Math.floor(Math.random() * 99) + 1
    avatar = `https://randomuser.me/portraits/${gender}/${num}.jpg`
  }

  const review = await prisma.review.create({
    data: { name, city, university, rating, text, avatar, approved: true },
  })

  console.log('[review-gen] created review id=%s name=%s rating=%d avatar=%s', review.id, name, rating, avatar || 'initials')
  return review
}

async function run() {
  const count = Math.random() < 0.5 ? 1 : 2
  const total = await prisma.review.count({ where: { approved: true } })
  console.log('[review-gen] generating %d review(s), total approved so far: %d', count, total)

  for (let i = 0; i < count; i++) {
    await generateOne(total + i)
  }

  await prisma.$disconnect()
  console.log('[review-gen] done')
}

run().catch((err) => {
  console.error('[review-gen] error:', err)
  prisma.$disconnect()
  process.exit(1)
})
