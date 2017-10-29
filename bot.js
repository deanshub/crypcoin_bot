const request = require('request');
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.token;

const defaultOptions = {
    reply_markup: {
        keyboard: [
            return {
                text: '/get',
                callback_data: '/get',
            };
        ],
        resize_keyboard: true,
        one_time_keyboard: true
    },
};

const bitsmapUrls =  {
    'Bitcoin': {
        'USD': 'https://www.bitstamp.net/api/v2/ticker/btcusd/',
        'EUR': 'https://www.bitstamp.net/api/v2/ticker/btceur/',
        'NIS': 'http://www.mycurrencytransfer.com/api/current/BTC/ILS'
    },
    'Etherum': {
        'USD': 'https://www.bitstamp.net/api/v2/ticker/ethusd/',
        'EUR': 'https://www.bitstamp.net/api/v2/ticker/etheur/',
        'BTC': 'https://www.bitstamp.net/api/v2/ticker/ethbtc/'
    },
    'Ripple': {
        'USD': 'https://www.bitstamp.net/api/v2/ticker/xrpusd/',
        'EUR': 'https://www.bitstamp.net/api/v2/ticker/xrpeur/',
        'BTC': 'https://www.bitstamp.net/api/v2/ticker/xrpbtc/'
    },
    'Litecoin': {
        'USD': 'https://www.bitstamp.net/api/v2/ticker/ltcusd/',
        'EUR': 'https://www.bitstamp.net/api/v2/ticker/ltceur/',
        'BTC': 'https://www.bitstamp.net/api/v2/ticker/ltcbtc/'
    },
};

const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/help/, function (msg) {
    const fromId = msg.from.id;
    const resp = 'no';
    bot.sendMessage(fromId, resp, defaultOptions);
});

function getCoinsOptions(rootObject) {
    return {
        reply_markup: {
            keyboard: [
                Object.keys(rootObject).map((crypcoin) => {
                    return {
                        text: crypcoin,
                        callback_data: crypcoin,
                    };
                }),
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        },
    }
}

bot.onText(/\/get/, function (msg) {
    const fromId = msg.from.id;
    const crypcoinOptions = getCoinsOptions(bitsmapUrls);
    bot.sendMessage(fromId, "Ok, what coin?", crypcoinOptions)
    .then(() => {
        bot.once("message", answer => {
            const crypcoin = answer.text;  
            if (Object.keys(bitsmapUrls).indexOf(crypcoin) === -1) {
                bot.sendMessage(fromId, "Unbale to detect coin", defaultOptions);
            } else {
                const crypcoinChoice = bitsmapUrls[crypcoin];
                const coinOptions = getCoinsOptions(crypcoinChoice);

                bot.sendMessage(fromId, "Choose", coinOptions)
                    .then(ans => {
                        bot.once("message", answer => {
                            const coin = answer.text;
                            if (Object.keys(crypcoinChoice).indexOf(coin) === -1) {
                                bot.sendMessage(fromId, "Unbale to detect coin", defaultOptions);
                            } else {
                                const url = crypcoinChoice[coin];
                                const isNis = coin === 'NIS';
                                getBitcoinPrice(url, isNis).then((lastPrice) => {
                                    bot.sendMessage(fromId, lastPrice, defaultOptions);
                                }).catch((error) => {
                                    const errorMessage = 'An error has occured';
                                    console.log(error);
                                    bot.sendMessage(fromId, errorMessage, defaultOptions);
                                });
                            }
                    });
                });
            }
        });
    });
});

function getBitcoinPrice(url, isNis) {
    return new Promise((resolve,reject)=>{
        request(url, function (error, response, body) {
          if (error || response.statusCode !== 200) {
            return reject(error||'Error getting data');
          }else{
            const response = JSON.parse(body);
            let lastCrypcoinPrice;

            if (isNis) {
                lastCrypcoinPrice = response.data.rate;
            } else {
                lastCrypcoinPrice = response.last;
            }

            resolve(lastCrypcoinPrice);
          }
        });
    });
  }
  
