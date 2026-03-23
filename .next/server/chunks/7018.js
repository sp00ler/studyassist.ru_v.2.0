"use strict";exports.id=7018,exports.ids=[7018],exports.modules={90455:(e,t,a)=>{a.d(t,{L:()=>c});var r=a(53797),i=a(7585),n=a(72331),s=a(42023),o=a.n(s);let d={id:"vk",name:"ВКонтакте",type:"oauth",checks:["pkce","state"],authorization:{url:"https://id.vk.com/authorize",params:{scope:"vkid.personal_info email",response_type:"code"}},token:{url:"https://id.vk.com/oauth2/auth",async request({params:e,checks:t,provider:a}){let r=new URLSearchParams({grant_type:"authorization_code",code:e.code,redirect_uri:a.callbackUrl,client_id:process.env.VK_CLIENT_ID,client_secret:process.env.VK_CLIENT_SECRET,code_verifier:t.code_verifier||"",device_id:e.device_id||"",state:e.state||""}),i=await fetch("https://id.vk.com/oauth2/auth",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:r.toString()});return{tokens:await i.json()}}},userinfo:{url:"https://id.vk.com/oauth2/user_info",async request({tokens:e}){let t=await fetch("https://id.vk.com/oauth2/user_info",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${e.access_token}`},body:new URLSearchParams({client_id:process.env.VK_CLIENT_ID})}),a=(await t.json()).user;return{id:String(a.user_id),name:`${a.first_name||""} ${a.last_name||""}`.trim()||`vk_${a.user_id}`,email:a.email||`vk_${a.user_id}@studyassist.ru`,image:a.avatar||null}}},profile:e=>({id:e.id,name:e.name,email:e.email,image:e.image,isAdmin:!1,phone:null}),clientId:process.env.VK_CLIENT_ID,clientSecret:process.env.VK_CLIENT_SECRET},l={id:"mailru",name:"Mail.ru",type:"oauth",authorization:{url:"https://oauth.mail.ru/login",params:{scope:"userinfo",response_type:"code"}},token:"https://oauth.mail.ru/token",userinfo:"https://oauth.mail.ru/userinfo",profile:e=>({id:e.id,name:e.name,email:e.email,image:e.image}),clientId:process.env.MAILRU_CLIENT_ID,clientSecret:process.env.MAILRU_CLIENT_SECRET},p={id:"yandex",name:"Яндекс",type:"oauth",authorization:{url:"https://oauth.yandex.ru/authorize",params:{scope:"login:email login:info login:avatar",response_type:"code"}},token:"https://oauth.yandex.ru/token",userinfo:"https://login.yandex.ru/info?format=json",profile:e=>({id:e.id,name:e.real_name||e.display_name,email:e.default_email,image:e.default_avatar_id?`https://avatars.yandex.net/get-yapic/${e.default_avatar_id}/islands-200`:null}),clientId:process.env.YANDEX_CLIENT_ID,clientSecret:process.env.YANDEX_CLIENT_SECRET},c={adapter:(0,i.N)(n._),session:{strategy:"jwt",maxAge:2592e3},pages:{signIn:"/auth/login",error:"/auth/login"},providers:[(0,r.Z)({name:"credentials",credentials:{email:{label:"Email",type:"email"},password:{label:"Пароль",type:"password"}},async authorize(e){if(!e?.email||!e?.password)throw Error("Введите email и пароль");let t=await n._.user.findUnique({where:{email:e.email}});if(!t||!t.passwordHash||!await o().compare(e.password,t.passwordHash))throw Error("Неверный email или пароль");return{id:t.id,email:t.email,name:t.name,image:t.avatar,isAdmin:t.isAdmin,phone:t.phone}}}),d,l,p],callbacks:{async jwt({token:e,user:t,account:a}){if(t&&(e.id=t.id,e.isAdmin=t.isAdmin??!1,e.phone=t.phone??null),a&&"credentials"!==a.provider){let t=await n._.user.findUnique({where:{email:e.email}});t&&(e.id=t.id,e.isAdmin=t.isAdmin,e.phone=t.phone)}return e},session:async({session:e,token:t})=>(t&&(e.user.id=t.id,e.user.isAdmin=t.isAdmin,e.user.phone=t.phone),e)},events:{async createUser({user:e}){e.email&&await n._.user.update({where:{id:e.id},data:{provider:"credentials"}}).catch(()=>{})},async signIn({user:e,account:t}){t&&"credentials"!==t.provider&&await n._.user.update({where:{id:e.id},data:{provider:t.provider,providerId:t.providerAccountId,avatar:e.image??void 0}}).catch(()=>{})}},secret:process.env.NEXTAUTH_SECRET}},36119:(e,t,a)=>{a.d(t,{Fs:()=>c,PO:()=>g,qL:()=>p});var r=a(55245),i=a(55315),n=a.n(i),s=a(92048),o=a.n(s);let d=r.createTransport({host:process.env.SMTP_HOST||"smtp.beget.com",port:parseInt(process.env.SMTP_PORT||"465"),secure:!0,auth:{user:process.env.SMTP_USER||"support@studyassist.ru",pass:process.env.SMTP_PASS||""},tls:{rejectUnauthorized:!1}});function l(e){let t=e.replace(/[^0-9]/g,"").slice(-5).padStart(5,"0");return`#${t}`}async function p(e){var t;let a=l(e.orderId),r={coursework:"Курсовая работа",diploma:"Дипломная работа (ВКР)",essay:"Реферат / Эссе",lab:"Лабораторная работа / Задача",presentation:"Презентация / Отчёт",other:"Другое"}[t=e.orderType]||t,i=[];if(e.files&&e.files.length>0)for(let t of e.files){let e=n().join(process.cwd(),"public",t);o().existsSync(e)&&i.push({filename:n().basename(t),path:e})}let s=`
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Новая заявка StudyAssist</title>
</head>
<body style="margin:0;padding:0;background:#0F0F1A;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F0F1A;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1A1A2E;border-radius:16px;overflow:hidden;border:1px solid rgba(108,62,244,0.3);">
          <tr>
            <td style="background:linear-gradient(135deg,#6C3EF4,#3B82F6);padding:32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">📋 Новая заявка ${a}</h1>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">StudyAssist.ru</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span style="color:#94A3B8;font-size:14px;">Тип работы</span><br>
                    <span style="color:#F1F5F9;font-size:16px;font-weight:600;">${r}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span style="color:#94A3B8;font-size:14px;">Предмет / Дисциплина</span><br>
                    <span style="color:#F1F5F9;font-size:16px;">${e.subject}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span style="color:#94A3B8;font-size:14px;">Дедлайн</span><br>
                    <span style="color:#F59E0B;font-size:16px;font-weight:600;">${e.deadline}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span style="color:#94A3B8;font-size:14px;">Описание задания</span><br>
                    <span style="color:#F1F5F9;font-size:15px;line-height:1.6;">${e.description.replace(/\n/g,"<br>")}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span style="color:#94A3B8;font-size:14px;">Имя клиента</span><br>
                    <span style="color:#F1F5F9;font-size:16px;">${e.name}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span style="color:#94A3B8;font-size:14px;">Email</span><br>
                    <a href="mailto:${e.email}" style="color:#6C3EF4;font-size:16px;">${e.email}</a>
                  </td>
                </tr>
                ${e.phone?`
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span style="color:#94A3B8;font-size:14px;">Телефон</span><br>
                    <a href="tel:${e.phone}" style="color:#6C3EF4;font-size:16px;">${e.phone}</a>
                  </td>
                </tr>
                `:""}
                <tr>
                  <td style="padding:12px 0;">
                    <span style="color:#94A3B8;font-size:14px;">Прикреплённые файлы</span><br>
                    <span style="color:#F1F5F9;font-size:16px;">${e.files?.length||0} шт.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <a href="${process.env.NEXTAUTH_URL}/admin/orders"
                 style="display:inline-block;background:linear-gradient(135deg,#6C3EF4,#3B82F6);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
                Открыть в панели администратора
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;await d.sendMail({from:`"StudyAssist" <${process.env.SMTP_USER}>`,to:process.env.SMTP_USER,subject:`📋 Новая заявка ${a} — ${r} (${e.subject})`,html:s,attachments:i})}async function c(e,t,a,r){let i=l(t),n={new:"Новая",in_progress:"В работе",ready_for_review:"Готова к проверке",awaiting_payment:"Ожидает оплаты",paid:"Оплачена",completed:"Завершена",cancelled:"Отменена"}[a]||a,s="awaiting_payment"===a&&r,o=`
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><title>Обновление заявки</title></head>
<body style="margin:0;padding:0;background:#0F0F1A;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F0F1A;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1A1A2E;border-radius:16px;overflow:hidden;border:1px solid rgba(108,62,244,0.3);">
          <tr>
            <td style="background:linear-gradient(135deg,#6C3EF4,#3B82F6);padding:32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;">Обновление заявки ${i}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;text-align:center;">
              <p style="color:#94A3B8;font-size:16px;">Статус вашей заявки изменён:</p>
              <div style="display:inline-block;background:rgba(108,62,244,0.2);border:1px solid #6C3EF4;color:#F1F5F9;padding:12px 24px;border-radius:8px;font-size:18px;font-weight:600;margin:16px 0;">
                ${n}
              </div>
              ${s?`
              <p style="color:#F1F5F9;font-size:16px;margin:24px 0 8px;">Ваша работа готова! Для получения файлов перейдите к оплате:</p>
              <a href="${r}"
                 style="display:inline-block;background:linear-gradient(135deg,#F59E0B,#EF4444);color:#fff;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;margin:8px 0;">
                Оплатить работу
              </a>
              `:""}
              <p style="color:#94A3B8;font-size:14px;margin-top:24px;">
                Вы можете отслеживать статус в <a href="${process.env.NEXTAUTH_URL}/dashboard" style="color:#6C3EF4;">личном кабинете</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;await d.sendMail({from:`"StudyAssist" <${process.env.SMTP_USER}>`,to:e,subject:`Заявка ${i}: статус изменён на "${n}"`,html:o})}async function g(e,t,a,r){let i=l(t),n=`
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><title>Ссылка на оплату</title></head>
<body style="margin:0;padding:0;background:#0F0F1A;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F0F1A;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1A1A2E;border-radius:16px;overflow:hidden;border:1px solid rgba(108,62,244,0.3);">
          <tr>
            <td style="background:linear-gradient(135deg,#6C3EF4,#3B82F6);padding:32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;">💳 Ссылка на оплату</h1>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">Заявка ${i}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;text-align:center;">
              <p style="color:#F1F5F9;font-size:16px;">Ваша работа проверена и готова к передаче.</p>
              <p style="color:#94A3B8;font-size:15px;">Стоимость работы:</p>
              <div style="font-size:32px;font-weight:700;color:#F59E0B;margin:16px 0;">${r.toLocaleString("ru-RU")} ₽</div>
              <a href="${a}"
                 style="display:inline-block;background:linear-gradient(135deg,#F59E0B,#EF4444);color:#fff;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;margin:16px 0;">
                Оплатить сейчас
              </a>
              <p style="color:#94A3B8;font-size:13px;margin-top:24px;">
                После оплаты работа будет автоматически доступна в вашем
                <a href="${process.env.NEXTAUTH_URL}/dashboard" style="color:#6C3EF4;">личном кабинете</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;await d.sendMail({from:`"StudyAssist" <${process.env.SMTP_USER}>`,to:e,subject:`Ссылка на оплату заявки ${i} — ${r.toLocaleString("ru-RU")} ₽`,html:n})}},72331:(e,t,a)=>{a.d(t,{_:()=>i});var r=a(53524);let i=globalThis.prisma??new r.PrismaClient({log:["error"]})},89833:(e,t,a)=>{a.d(t,{LE:()=>p,ch:()=>l,sh:()=>d});var r=a(66088),i=a.n(r);let n=null;function s(){return process.env.TELEGRAM_BOT_TOKEN?(n||(n=new(i())(process.env.TELEGRAM_BOT_TOKEN,{polling:!1})),n):null}function o(e){let t=e.replace(/[^0-9]/g,"").slice(-5).padStart(5,"0");return`#${t}`}async function d(e){var t;let a=s(),r=process.env.TELEGRAM_CHAT_ID;if(!a||!r){console.warn("Telegram bot not configured, skipping notification");return}let i=o(e.orderId),n={coursework:"Курсовая работа",diploma:"Дипломная работа (ВКР)",essay:"Реферат / Эссе",lab:"Лабораторная работа / Задача",presentation:"Презентация / Отчёт",other:"Другое"}[t=e.orderType]||t,d=`${process.env.NEXTAUTH_URL}/admin/orders`,l=`
📋 *Новая заявка ${i}*

📚 *Тип:* ${n}
📖 *Предмет:* ${e.subject}
⏰ *Дедлайн:* ${e.deadline}

📝 *Описание:*
${e.description.slice(0,500)}${e.description.length>500?"...":""}

👤 *Клиент:* ${e.name}
📧 *Email:* ${e.email}
${e.phone?`📱 *Телефон:* ${e.phone}`:""}
📎 *Файлы:* ${e.filesCount} шт.

[Открыть в панели администратора](${d})
  `.trim();await a.sendMessage(r,l,{parse_mode:"Markdown"})}async function l(e,t,a,r){let i=s();if(!i||!e)return;let n=o(t),d=`📋 *Заявка ${n}*

Статус изменён: *${{new:"Новая",in_progress:"\uD83D\uDD27 В работе",ready_for_review:"✅ Готова к проверке",awaiting_payment:"\uD83D\uDCB3 Ожидает оплаты",paid:"✅ Оплачена",completed:"\uD83C\uDF89 Завершена",cancelled:"❌ Отменена"}[a]||a}*`;"awaiting_payment"===a&&r?d+=`

Ваша работа готова! Перейдите по ссылке для оплаты:
[Оплатить работу](${r})`:"completed"===a&&(d+=`

Работа передана. Спасибо за доверие! 🎓`),d+=`

[Перейти в личный кабинет](${process.env.NEXTAUTH_URL}/dashboard)`,await i.sendMessage(e,d,{parse_mode:"Markdown"})}async function p(e,t,a,r){let i=s();if(!i||!e)return;let n=o(t),d=`
💳 *Ссылка на оплату — ${n}*

Стоимость работы: *${r.toLocaleString("ru-RU")} ₽*

[Оплатить работу](${a})

После оплаты работа будет доступна в [личном кабинете](${process.env.NEXTAUTH_URL}/dashboard)
  `.trim();await i.sendMessage(e,d,{parse_mode:"Markdown"})}}};