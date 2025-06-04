require('dotenv').config();

const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const cron = require('node-cron');

dayjs.extend(utc);

const token = process.env.TELEGRAM_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const CHAT_ID = process.env.CHAT_ID;
const PORT = process.env.PORT || 3000;

if (!token || !WEBHOOK_URL || !CHAT_ID) {
  console.error('ERROR: Отсутствуют обязательные переменные окружения TELEGRAM_TOKEN, WEBHOOK_URL или CHAT_ID');
  process.exit(1);
}

const app = express();
app.use(express.json());

const bot = new TelegramBot(token, { webHook: true });

const birthdays = require('./birthdays.json');

function checkBirthdays(chatContext = null) {
    const today = dayjs().utc().startOf('day');
    const thisYear = today.year();
    let found = false;
  
    birthdays.forEach(({ name, date }) => {
      const birthdayThisYear = dayjs(`${thisYear}-${date}`);
      const diff = birthdayThisYear.diff(today, 'day');
  
      if (diff === 2) {
        const msg = `📅 Через 2 дня день рождения у "${name}"!`;
        console.log(msg);
        bot.sendMessage(CHAT_ID, msg);
        if (chatContext) bot.sendMessage(chatContext, msg);
        found = true;
      } else if (diff === 0) {
        const msg = `🎉 Сегодня день рождения у "${name}"! Поздравляем!`;
        console.log(msg);
        bot.sendMessage(CHAT_ID, msg);
        if (chatContext) bot.sendMessage(chatContext, msg);
        found = true;
      }
    });
  
    if (!found && chatContext) {
      const msg = '🎈 В ближайшие дни нет дней рождений.';
      console.log(msg);
      bot.sendMessage(chatContext, msg);
    }
  }

app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>Birthday Bot</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              margin-top: 100px;
              background-color: #f9f9f9;
              color: #333;
            }
            .emoji {
              font-size: 3rem;
            }
          </style>
        </head>
        <body>
          <div class="emoji">🎉🤖🎈</div>
          <h1>Birthday Bot работает!</h1>
          <p>Webhook установлен и бот на связи.</p>
        </body>
      </html>
    `);
  });

app.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);

  try {
    const botInfo = await bot.getMe();
    console.log('✅ Токен рабочий. Информация о боте:', botInfo);

    await bot.setWebHook(`${WEBHOOK_URL}/webhook`);
    console.log('Webhook установлен на:', `${WEBHOOK_URL}/webhook`);

    bot.sendMessage(CHAT_ID, 'Бот запущен и готов отправлять сообщения!');
    checkBirthdays();
  } catch (err) {
    console.error('❌ Ошибка авторизации или установки webhook:', err);
    process.exit(1);
  }
});

bot.on('message', (msg) => {
  console.log('Новое сообщение:', JSON.stringify(msg, null, 2));
});

bot.onText(/\/start/, (msg) => {
  console.log('Команда /start получена от:', msg.from);
  bot.sendMessage(msg.chat.id, 'Привет! Я бот для напоминания о днях рождения.');
});

bot.onText(/\/check/, (msg) => {
    console.log('Команда /check получена от:', msg.from);
    bot.sendMessage(msg.chat.id, '🔍 Проверяю дни рождения...');
    checkBirthdays(msg.chat.id); // ← передаём ID чата, чтобы отправить ответ
  });

// Cron-задание для ежедневной проверки (пример — 06:35 UTC = 11:35 Ташкент)
cron.schedule('30 2 * * *', () => {
  console.log('⏰ Автоматическая проверка дней рождений в 7:30 по Ташкенту (02:30 UTC)...');
  checkBirthdays();
});