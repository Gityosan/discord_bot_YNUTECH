const { Client, Intents } = require('discord.js');
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
  // console.log(title);
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

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  const { commandName } = interaction;

  if (commandName === 'vote') {
    const subCommand = interaction.options.getSubcommand();
    if (subCommand === 'help') {
      await interaction.channel.send(
        '/vote startコマンドと/vote finishコマンドの説明をします。\n/vote start\n新たに投票を開始します。同時に開催できる投票は一人につき一つまでです。\n/vote finish\n現在開催中の投票を終了します。',
      );
    } else {
      const vote = await microcms
        .get({
          endpoint: 'vote',
          queries: {
            filters: 'user_id[equals]' + interaction.user.id,
          },
        })
        .catch((err) => console.log(err));
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
            .catch((err) => console.log(err));
        }
      } else if (subCommand === 'finish') {
        const items = vote.contents;
        if (items.length) {
          items.filter(async (v) => {
            const message = await interaction.channel.messages.fetch(
              v.message_id,
            );
            const agree = message.reactions.cache.get('👌');
            const against = message.reactions.cache.get('🤚');
            await interaction.channel.send(
              '投票の結果\n賛成' +
                (agree.count - 1) +
                '票\n反対' +
                (against.count - 1) +
                '票\nでした。',
            );
          });
          for (let i = 0, len = vote.contents.length; i < len; i++) {
            await axios
              .delete(
                'https://ynutechbot.microcms.io/api/v1/vote/' +
                  vote.contents[i].id,
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
        } else {
          interaction.reply(
            'まだ投票が開始されていません。先に/vote startで投票を開始して下さい。',
          );
        }
      }
    }
  } else if (commandName === 'annotation') {
    let content = interaction.options.getString('content');
    if (content.length >= 60) {
      content = content.substring(0, 59) + '..';
    }
    const color = interaction.options.getString('color');
    const imageURL = color || image[0][1];
    const imageString = createOgImage(
      imageBaseUrl + imageURL,
      interaction.user.username,
      content,
    );
    await interaction.reply({ files: [imageString] });
  }
});
client.login(token);
