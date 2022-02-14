const { Client, Intents, MessageActionRow } = require('discord.js');
const axios = require('axios');
const {
  token,
  image,
  microcmsApiKey,
  microcmsApiUrl,
  imageBaseUrl,
} = require('./config.json');
const base64url = require('base64url');
const { createClient } = require('microcms-js-sdk');

const client = new Client({ intents: Object.keys(Intents.FLAGS) });

const microcms = createClient({
  serviceDomain: microcmsApiUrl, // YOUR_DOMAIN is the XXXX part of XXXX.microcms.io
  apiKey: microcmsApiKey,
});

const createOgImage = (baseImageUrl, author, title) => {
  const ogImageUrl = `${baseImageUrl}?w=300&txt64=${base64url(
    author,
  )}&txt-pad=20&txt-color=00695C&txt-size=12&txt-align=left,top&blend64=${base64url(
    `https://assets.imgix.net/~text?txtsize=12&txt-color=262626&w=260&txt-align=center,middle&txt-track=4&txtfont=Hiragino%20Sans%20W6&txt64=${base64url(
      title,
    )}`,
  )}&blend-mode=normal&blend-align=middle,left&blend-x=20&blend-y=50`;
  return ogImageUrl;
};
client.on('ready', () => {
  console.log(`${client.user.tag} でログインしています。`);
});

// client.on('messageCreate', (msg) => {
//   if (msg.author.bot) return; //BOTのメッセージには反応しない

//   if (msg.content === '/hello') {
//     msg.channel.send('hello');
//   }
// });
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  // console.log(interaction);
  const { commandName } = interaction;

  if (commandName === 'vote') {
    const vote = await microcms
      .get({
        endpoint: 'vote',
        queries: {
          filters: 'user_id[equals]' + interaction.user.id,
        },
      })
      .catch((err) => console.log(err));
    const subCommand = interaction.options.getSubcommand();
    if (subCommand === 'start') {
      if (vote.totalCount) {
        await interaction.reply(
          'すでに開催中の投票があります。そちらを先に完了させて下さい。',
        );
      } else {
        const content = interaction.options.getString('content');
        await interaction.reply('投票を開始します。');
        const message = await interaction.channel.send(
          '投票内容は、\n「' +
            content +
            '」\nです。\n賛成の方は👌を、反対の方は🤚のスタンプを押して下さい。',
        );
        await message.react('👌');
        await message.react('🤚');
        await axios
          .post(
            'https://ynutechbot.microcms.io/api/v1/vote',
            {
              user_id: interaction.user.id,
              message_id: message.id,
              content: content,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'X-MICROCMS-API-KEY': microcmsApiKey,
              },
            },
          )
          // .then((res) => console.log(res))
          .catch((err) => console.log(err));
      }
    } else if (subCommand === 'finish') {
      vote.contents.filter(async (v) => {
        const message = await interaction.channel.messages.fetch(v.message_id);
        const agree = message.reactions.cache.get('👌');
        const against = message.reactions.cache.get('🤚');
        await interaction.channel.send(
          '投票の結果\n賛成' +
            agree.count +
            '票\n反対' +
            against.count +
            '票\nでした。',
        );
      });
      for (let i = 0, len = vote.contents.length; i < len; i++) {
        await axios
          .delete(
            'https://ynutechbot.microcms.io/api/v1/vote/' + vote.contents[i].id,
            {
              headers: {
                'Content-Type': 'application/json',
                'X-MICROCMS-API-KEY': microcmsApiKey,
              },
            },
          )
          .catch((err) => console.log(err));
      }
      interaction.reply('投票を完了します');
    }
  } else if (commandName === 'annotation') {
    const content = interaction.options.getString('content');
    const color = interaction.options.getString('color');
    const imageString = createOgImage(
      imageBaseUrl + color || imageBaseUrl + image[0][1],
      interaction.user.username,
      content,
    );
    await interaction.reply({ files: [imageString] });
  }
});
client.login(token);
