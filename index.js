require('dotenv').config();
console.log('Загруженный токен из .env:', process.env.TELEGRAM_TOKEN);

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

function checkBirthdays() {
  const today = dayjs().utc().startOf('day');
  const thisYear = today.year();

  birthdays.forEach(({ name, date }) => {
    const birthdayThisYear = dayjs(`${thisYear}-${date}`);
    const diff = birthdayThisYear.diff(today, 'day');

    if (diff === 2) {
      bot.sendMessage(CHAT_ID, `📅 Через 2 дня день рождения у "${name}"!`);
    } else if (diff === 0) {
      bot.sendMessage(CHAT_ID, `🎉 Поздравляем с днём рождения, "${name}"!`);
    }
  });
}

app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/', (req, res) => res.send('Bot is running'));

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

// Cron-задание для ежедневной проверки (пример — 06:35 UTC = 11:35 Ташкент)
cron.schedule('35 6 * * *', () => {
  console.log('⏰ Автоматическая проверка дней рождений в 11:35 по Ташкенту (06:35 UTC)...');
  checkBirthdays();
});