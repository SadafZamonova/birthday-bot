require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

const app = express();
app.use(express.json()); // для парсинга JSON из webhook

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { webHook: true });

const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL; // Должен быть https://yourdomain.com/webhook

// Устанавливаем webhook при запуске сервера
bot.setWebHook(`${WEBHOOK_URL}/webhook`).then(() => {
  console.log('Webhook установлен на:', `${WEBHOOK_URL}/webhook`);
}).catch(console.error);

const birthdays = require('./birthdays.json');

function checkBirthdays() {
  const today = dayjs().utc().startOf('day');
  const thisYear = today.year();

  birthdays.forEach(({ name, date }) => {
    const birthdayThisYear = dayjs(`${thisYear}-${date}`);
    const diff = birthdayThisYear.diff(today, 'day');

    if (diff === 2) {
      bot.sendMessage(process.env.CHAT_ID, `📅 Через 2 дня день рождения у ${name}!`);
    } else if (diff === 0) {
      bot.sendMessage(process.env.CHAT_ID, `🎉 Поздравляем с днём рождения, ${name}!`);
    }
  });
}

// Маршрут для Telegram webhook
app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/', (req, res) => res.send('Bot is running'));
console.log('process.env.PORT =', process.env.PORT);
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Запуск проверки дней рождения через cron
const cron = require('node-cron');
cron.schedule('20 15 * * *', () => {
  console.log('⏰ Запуск автоматической проверки в 15:20...');
  checkBirthdays();
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Привет! Я бот для напоминания о днях рождения.');
});

console.log('Bot starting at', new Date().toISOString());
