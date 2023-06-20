const TelegramApi = require('node-telegram-bot-api')
const token = '6244574892:AAERTiaQsqs8zPdkd95Q45v_nADqZ_1q2IM'
const {gameOptions, againOptions} = require('./options')

const bot = new TelegramApi(token, {polling: true})
const chats = {}

const startGame = async (chatId) => {
    await bot.sendMessage(chatId, 'Сейчас я загадаю цифру от 0 до 9, а ты попробуй её угадать :)')
    const randomNumber = Math.floor(Math.random() * 10)
    chats[chatId] = randomNumber
    await bot.sendMessage(chatId, 'Отгадай', gameOptions)
}

const start = () => {
    bot.setMyCommands([
        {command: '/start', description: 'Начальное приветствие'},
        {command: '/info', description: 'Информация о пользователе'},
        {command: '/game', description: 'Игра: "Угадай цифру"'},
    ])

    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;
        const name = msg.from.first_name;
        const surname = msg.from.last_name;

        if (text === '/start'){
            await bot.sendSticker(chatId, 'https://chpic.su/_data/stickers/s/shiba_supra/shiba_supra_004.webp?v=1687246501')
            return bot.sendMessage(chatId, `Добро пожаловать, ${name}`)
        }
        if (text === '/info') {
            return bot.sendMessage(chatId, `Пользователь ${name} ${surname}. Ты написал мне - "${text}"`)
        }
        if (text === '/game') {
            return startGame(chatId)
        }

        return bot.sendMessage(chatId, 'Я тебя не понимаю)')
    })

    bot.on('callback_query', async msg => {
        const data = msg.data;
        const chatId = msg.message.chat.id;

        if (data === '/again') {
            return startGame(chatId)
        }

        if (parseInt(data) === chats[chatId]) {
            return await bot.sendMessage(chatId, `Поздравляю! Ты отгадал цифру ${chats[chatId]} которую загадал бот.`, againOptions)
        } else {
            return await bot.sendMessage(chatId, `Ты выбрал цифру ${data}, к сожалению ты не угадал, бот загадал другую цифру (${chats[chatId]}).`, againOptions)
        }


    })
}

start()