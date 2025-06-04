require('dotenv').config();
console.log('TOKEN из .env:', process.env.TELEGRAM_TOKEN);
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

// Проверяем обязательные переменные окружения
if (!token || !WEBHOOK_URL || !CHAT_ID) {
  console.error('ERROR: Отсутствуют обязательные переменные окружения TELEGRAM_TOKEN, WEBHOOK_URL или CHAT_ID');
  process.exit(1);
}

// Инициализируем бота с вебхуком
const bot = new TelegramBot(token, { webHook: true });
const app = express();
app.use(express.json());
bot.getMe()
  .then(console.log)
  .catch(console.error);
const birthdays = require('./birthdays.json');

// Функция проверки дней рождения
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

// Проверяем токен и ставим webhook
bot.getMe()
  .then(botInfo => {
    console.log('✅ Токен рабочий. Информация о боте:', botInfo);

    return bot.setWebHook(`${WEBHOOK_URL}/webhook`);
  })
  .then(() => {
    console.log('Webhook установлен на:', `${WEBHOOK_URL}/webhook`);
  })
  .catch(err => {
    console.error('❌ Ошибка авторизации или установки webhook:', err);
    process.exit(1);
  });

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

  // Уведомляем чат, что бот запущен
  bot.sendMessage(CHAT_ID, 'Бот запущен и готов отправлять сообщения!');

  // Тестовый вызов проверки дней рождения при запуске
  checkBirthdays();
});

// Cron-задание для ежедневной проверки (в 10:25 по Ташкенту = 05:25 UTC)
cron.schedule('25 6 * * *', () => {
  console.log('⏰ Автоматическая проверка дней рождений в 11:25 по Ташкенту (06:25 UTC)...');
  checkBirthdays();
});