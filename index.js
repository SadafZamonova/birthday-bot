require('dotenv').config();

console.log('TOKEN:', process.env.TELEGRAM_TOKEN);
console.log('WEBHOOK_URL:', process.env.WEBHOOK_URL);

const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const cron = require('node-cron');

dayjs.extend(utc);

const app = express();
app.use(express.json());

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { webHook: true });

bot.getMe()
  .then(botInfo => {
    console.log('✅ Токен рабочий. Информация о боте:', botInfo);

    bot.setWebHook(`${WEBHOOK_URL}/webhook`)
      .then(() => {
        console.log('Webhook установлен на:', `${WEBHOOK_URL}/webhook`);
      })
      .catch(console.error);

  })
  .catch(err => {
    console.error('❌ Ошибка авторизации (неверный токен?):', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const CHAT_ID = process.env.CHAT_ID;


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

// Установка webhook
bot.setWebHook(`${WEBHOOK_URL}/webhook`)
  .then(() => {
    console.log('Webhook установлен на:', `${WEBHOOK_URL}/webhook`);
  })
  .catch(console.error);

// Обработка команд и сообщений
bot.on('message', (msg) => {
  console.log('Новое сообщение:', JSON.stringify(msg, null, 2));
});

bot.onText(/\/start/, (msg) => {
  console.log('Команда /start получена от:', msg.from);
  bot.sendMessage(msg.chat.id, 'Привет! Я бот для напоминания о днях рождения.');
});

// Маршрут для Telegram webhook
app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/', (req, res) => res.send('Bot is running'));

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  bot.sendMessage(CHAT_ID, 'Бот запущен и готов отправлять сообщения!');
  checkBirthdays(); // тестовый вызов
});

// Cron-задание для проверки дней рождений (10:25 по Ташкенту = 05:25 UTC)
cron.schedule('25 5 * * *', () => {
  console.log('⏰ Автоматическая проверка дней рождений в 10:25 по Ташкенту (05:25 UTC)...');
  checkBirthdays();
});
