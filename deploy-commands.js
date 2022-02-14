const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token, image } = require('./config.json');

const commands = [
  new SlashCommandBuilder()
    .setName('vote')
    .setDescription("Let's vote!")
    .addSubcommand((sub) =>
      sub
        .setName('start')
        .setDescription('Start a vote')
        .addStringOption((option) =>
          option
            .setName('content')
            .setDescription('What to vote for.')
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName('finish').setDescription('Finish this vote.'),
    ),
  new SlashCommandBuilder()
    .setName('annotation')
    .setDescription("Let's annotation!")
    .addStringOption((option) =>
      option
        .setName('content')
        .setDescription('What to vote for.')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('color')
        .setDescription('Image Frame Color.')
        .addChoices(image),
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  .then(() => console.log('Successfully registered application commands.'))
  .catch(console.error);
