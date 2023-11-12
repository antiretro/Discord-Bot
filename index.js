require('dotenv').config();
const { Client, IntentsBitField, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { competitionGoals } = require('./register-commands');
const schedule = require('node-schedule');
const crypto = require('crypto');


const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,]
})
let key = process.env.
let tracked
let channel
let lastUse
let isCompetitionActive = false;
let amountPerTicket;
let startEpoch;
let endEpoch;
let startJob;
let endJob;
let updateJob;
let entryFee;
let prizePool = 0;
let competitionArray = []
let donatorArray = []
const headers = new Headers({
  'Accept': 'application/json',
});

class Player {
  constructor(name, profile, uuid, startCollection, currentCollection, hasPaid, tickets) {
    this.name = name;
    this.profile = profile;
    this.uuid = uuid;
    this.startCollection = startCollection;
    this.currentCollection = currentCollection;
    this.hasPaid = hasPaid;
    this.tickets = tickets
  }
}

function addPlayer(name, profile, uuid, startCollection, currentCollection) {

  const isAlreadyEntered = competitionArray.some(player => player.uuid === uuid);

  if (isAlreadyEntered) {
    console.log(`Player ${name} is already signed up for the competition!`);
    return 'duplicate';
  } else {
    const player = new Player(name, profile, uuid, startCollection, currentCollection, false, 0);
    competitionArray.push(player);
    return 'added';
  }
}

class Donator {
  constructor(name, donation) {
    this.name = name;
    this.donation = donation;
  }
}

function addDonator(name, donation) {

  const donatorIndex = donatorArray.findIndex(donator => donator.name.toLowerCase() === name.toLowerCase());

  if (donatorIndex === -1) {
    const donator = new Donator(name, donation)
    donatorArray.push(donator)
  } else {
    donatorArray[donatorIndex].donation += donation
  }
}

client.on('ready', () => {
  channel = client.channels.cache.get('1169004546014580806');
  if (!channel) {
    console.error('Failed to find channel');
    return;
  }
  console.log(`${client.user.tag} is online and channel is set.`);
});

function scheduleCompetition(startDate, endDate) {
  isCompetitionActive = true;
  startJob = schedule.scheduleJob(startDate, () => {
    console.log('Competition has started.');
    startCollectionTracking();
  });

  updateJob = schedule.scheduleJob('*/5 * * * *', updateAllCollections);

  endJob = schedule.scheduleJob(endDate, () => {
    console.log('Competition has ended. Conducting raffle.');
    endCompetition();
  });

  console.log(`Competition scheduled to start at ${startDate.toUTCString()} and end at ${endDate.toUTCString()}.`);
}


client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  switch (interaction.commandName) {
    case 'join':
      let now = Date.now();
      if (competitionArray.length !== 0 && now - lastUse < 3000) {
        interaction.reply({ content: 'On Cooldown. Wait 3 Seconds.', ephemeral: true });
        return;
      }

      if (!isCompetitionActive) {
        interaction.reply({ content: 'There is no Active Competition', ephemeral: true })
        return;
      }
      const ign = interaction.options.get('minecraft-ign').value;
      const wantedProfile = interaction.options.get('profile-name').value;

      await interaction.deferReply({ ephemeral: true });
      lastUse = Date.now();

      const { wantedProfileID, memberID } = await fetchPlayerData(ign, wantedProfile);

      if (wantedProfileID && memberID) {
        const result = addPlayer(ign, wantedProfileID, memberID, 0, 0);
        if (result === 'added') {
          if (!await trackCollection(competitionArray[competitionArray.length - 1], true)) {
            const apioff = new EmbedBuilder()
              .setColor('Red')
              .setTitle('Failed')
              .setDescription('Collection API Is Turned Off\nTurn On API and Try Again in 10 minutes');
            await interaction.editReply({ embeds: [apioff] });
            competitionArray.pop();
          } else {
            const success = new EmbedBuilder()
              .setColor('Green')
              .setTitle('Success')
              .setDescription(`Successfully Registered You For the Competition\nMake Sure to Pay the ${formatNumber(entryFee)} to JackFromHell1 As Soon As Possible\nYou Can Check Your Payment Status By Running /Standings After Competition Starts`);
            await interaction.editReply({ embeds: [success] });
          }
        } else if (result === 'duplicate') {
          await interaction.editReply('You have already joined the competition.');
        }
      } else {
        await interaction.editReply('There was a problem registering you for the competition.');
      }

      break;

    case 'verify':
      const ignVerify = interaction.options.get('minecraft-ign').value.toLowerCase();
      const player = competitionArray.find(p => p.name.toLowerCase() === ignVerify);


      if (player) {
        player.hasPaid = true;
        interaction.reply({
          content: `${ignVerify} has paid and is eligible to win.`, ephemeral: true
        });
      } else {
        interaction.reply({
          content: `Player not entered into competition: ${ignVerify}`, ephemeral: true
        });
      }
      break;


    case 'start':
      if (isCompetitionActive) {
        await interaction.reply({
          content: 'A competition is already active. Please wait until it ends or cancel it before scheduling a new one.',
          ephemeral: true
        });
        return;
      }

      const startDateStr = interaction.options.getString('start-date');
      const endDateStr = interaction.options.getString('end-date');
      let collectionTracked = interaction.options.getString('collection-tracked');
      amountPerTicket = interaction.options.getInteger('collection-per-ticket');
      entryFee = interaction.options.getInteger('entry-fee')

      if (!(competitionGoals.has(collectionTracked))) {
        await interaction.reply({ content: 'Collection not recognized.', ephemeral: true });
        return;
      }
      if (amountPerTicket <= 0) {
        await interaction.reply({ content: 'Amount Per Ticket Must Be Greater Than 0.', ephemeral: true });
        return;
      }
      tracked = competitionGoals.get(collectionTracked);
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);

      if (startDate < Date.now()) {
        await interaction.reply({ content: 'Start date must be in the future.', ephemeral: true });
        return;
      } else if (endDate <= startDate) {
        await interaction.reply({ content: 'End date must be after the start date.', ephemeral: true });
        return;
      }
      startEpoch = startDate.getTime()
      endEpoch = endDate.getTime()

      scheduleCompetition(startDate, endDate);
      await interaction.reply({
        content: `The competition has been scheduled to start on ${startDateStr} and end on ${endDateStr}, tracking the collection of ${collectionTracked}.\nThe collection required per ticket is ${formatNumber(amountPerTicket)}.\nEntry fee is ${formatNumber(entryFee)}`,
        ephemeral: true
      });
      break;
    case 'standings':
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Error")
      if (startEpoch > Date.now() || startEpoch === undefined) {
        errorEmbed.setDescription(`The Competition Hasn\'t started yet\nCompetition start: ${startEpoch !== undefined ? '<t:' + startEpoch / 1000 + '> <t:' + startEpoch / 1000 + ':R>' : ' /'}`)
        interaction.reply({ embeds: [errorEmbed], ephemeral: true })
        return
      }

      let ignStandings = interaction.options.get('minecraft-ign')
      if (ignStandings === null) {
        const standingsEmbeds = generateEmbeds(25, false)
        interaction.reply({ embeds: standingsEmbeds, ephemeral: true })
        return
      }
      ignStandings = ignStandings.value.toLowerCase()
      let standingsIndex = competitionArray.findIndex(player => player.name.toLowerCase() === ignStandings.toLowerCase())
      if (standingsIndex === -1) {
        errorEmbed.setDescription('You Haven\'t entered yet')
        interaction.reply({ embeds: [errorEmbed], ephemeral: true })
        return
      }

      let tempCollection = competitionArray[standingsIndex].currentCollection === 0 ? 0 : competitionArray[standingsIndex].currentCollection - competitionArray[standingsIndex].startCollection
      const standingsEmbed = new EmbedBuilder()
        .setColor(0x32CD32)
        .setTitle(`${standingsIndex + 1}. ${competitionArray[standingsIndex].name} ${competitionArray[standingsIndex].hasPaid ? '✅' : '❌'}`)
        .setDescription(formatNumber(tempCollection))

      interaction.reply({ embeds: [standingsEmbed], ephemeral: true })
      break;
    case 'donation':
      let donation = interaction.options.getInteger('donation-amount')
      let donator = interaction.options.get('minecraft-ign').value
      prizePool += donation
      let donationEmbed = new EmbedBuilder()
        .setAuthor({ name: 'Certified Jammers', iconURL: 'https://imgur.com/DfHQIRL.png' })
        .setTitle('Donation')
        .setDescription(`${donator} Has Donated ${formatNumber(donation)}`)
        .setColor(0x55ffff)
      interaction.reply({ content: 'ok', ephemeral: true })
      interaction.channel.send({ embeds: [donationEmbed] })
      addDonator(donator, donation)
      break;
    case 'cancel':
      if (startJob && endJob) {
        startJob.cancel();
        endJob.cancel();
        updateJob.cancel();
        console.log('Competition has been canceled.');
        interaction.reply({ content: 'Competition has been canceled', ephemeral: true });
        resetCompetition();
      }
      break;
    default:
      await interaction.reply({ content: 'Command not recognized.', ephemeral: true });
      break;
  }
});


async function trackCollection(player, start) {

  try {
    const get = 'https://api.hypixel.net/skyblock/profile?profile=' + player.profile + '&key=' + key;
    const res = await fetch(get, { headers })
    const data = await res.json()

    if (player.profile) {
      let competitionValue = data.profile.members[player.uuid].collection[tracked]
      competitionValue = competitionValue === undefined ? 0 : competitionValue
      if (start) player.startCollection = competitionValue
      if (channel) {
        player.currentCollection = competitionValue
      }
      console.log('Successfully logged')
    } else {
      console.log('Failed to log')
    }
  } catch (error) {
    if (error.toString() === `TypeError: Cannot read properties of undefined (reading '` + tracked + `')`) {
      if (start) {

        return 0
      }
    }
    console.log('Error' + error)
  }

  return 1
}

async function updateAllCollections() {
  if (Date.now() <= startEpoch || Date.now() >= endEpoch)
    return;

  const trackPromises = competitionArray.map(player => trackCollection(player, false));

  await Promise.all(trackPromises);

  competitionArray.sort((a, b) => (b.currentCollection - b.startCollection) - (a.currentCollection - a.startCollection));
}


async function startCollectionTracking() {
  const trackPromises = competitionArray.map(player => trackCollection(player, true));
  await Promise.all(trackPromises);

  competitionArray.sort((a, b) => (b.startCollection) - (a.startCollection))
  const embeds = generateEmbeds(25, true);
  channel.send({ embeds })
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'track') {
    tracked = interaction.options.get('competition-goal').value
    interaction.reply('Successfully Changed to ' + tracked.toString())
  }
})

client.login(process.env.TOKEN);

async function fetchPlayerData(ign, wantedProfile) {
  let wantedProfileID;
  let memberID;

  try {
    const profileUrl = `https://sky.shiiyu.moe/api/v2/profile/${ign}`;
    const profileResponse = await axios.get(profileUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    const profileData = profileResponse.data;

    memberID = await getPlayerUUID(ign);
    if (!memberID) {
      console.log(`UUID not found for ${ign}.`);
      return;
    }

    for (const profileID in profileData.profiles) {
      if (profileData.profiles[profileID].cute_name === wantedProfile) {
        wantedProfileID = profileID;
        break;
      }
    }

    if (!wantedProfileID) {
      console.log(`Profile with cute name '${wantedProfile}' not found.`);
      return 'Error';
    }

  } catch (error) {
    console.log('Error:');
  }

  return { wantedProfileID, memberID };
}

function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function generateEmbeds(itemsPerPage = 25, start) {
  const embeds = [];

  for (let i = 0; i < Math.ceil(competitionArray.length / itemsPerPage); i++) {
    const startIndex = i * itemsPerPage;
    const endIndex = Math.min((i + 1) * itemsPerPage, competitionArray.length);

    const embed = new EmbedBuilder()
    start ? embed.setColor(0xC8A2C8) : embed.setColor(0x32CD32)

    for (let index = startIndex; index < endIndex; index++) {
      let temporaryCollection = start ? competitionArray[index].startCollection : competitionArray[index].currentCollection - competitionArray[index].startCollection
      embed.addFields({
        name: `${index + 1}. ${competitionArray[index].name} ${competitionArray[index].hasPaid ? '✅' : '❌'}`,
        value: `${formatNumber(temporaryCollection)}`,
      });
    }

    embeds.push(embed);
  }
  if (embeds.length === 0) {
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('Error')
      .setDescription('There was no data to be found. Please contact the developers of the bot.')
    embeds.push(embed);
  } else if (start) {
    embeds[0]
      .setTitle('Start of Competition')
      .setDescription('These are the Starting Values of the Competition')
  } else {
    embeds[0]
      .setTitle('End of Competition')
      .setDescription('These are the Ending Values of the Competition')
  }
  embeds[0]
    .setAuthor({ name: 'Certified Jammers', iconURL: 'https://imgur.com/DfHQIRL.png' })
    .setThumbnail('https://imgur.com/DfHQIRL.png')
  embeds[embeds.length - 1]
    .setFooter({
      text: 'Made By IcyRetro, NachoQT, and JackFromHell1',
      iconURL: 'https://imgur.com/DfHQIRL.png'
    });
  return embeds;
}

async function getPlayerUUID(username) {
  try {
    const apiUrl = `https://api.mojang.com/users/profiles/minecraft/${username}`;
    const response = await axios.get(apiUrl);

    if (response.status === 200) {
      const data = response.data;
      return data.id;
    } else {
      console.error(`Failed to retrieve player data for ${username}`);
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

function calculateTickets(player) {
  player.tickets = Math.floor((player.currentCollection - player.startCollection) / amountPerTicket);
}

function getRandomInt(max) {
  const buffer = crypto.randomBytes(4);
  const hex = buffer.toString('hex');
  const randomInt = parseInt(hex, 16);
  return randomInt % max;
}

function calculatePrizeDistribution(numberOfWinners, totalPrizePool) {
  let totalCoefficient = 0;
  for (let i = numberOfWinners; i > 0; i--) {
    totalCoefficient += i;
  }

  let prizeDistribution = [];
  for (let i = numberOfWinners; i > 0; i--) {
    let prizeForWinner = (i / totalCoefficient) * totalPrizePool;
    prizeDistribution.push(prizeForWinner);
  }

  return prizeDistribution;
}

function conductRaffle(totalPrizePool, percentWinners = 15, minWinners = 5) {
  let ticketPool = [];

  competitionArray.forEach(player => {
    if (player.hasPaid && player.tickets > 0) {
      for (let i = 0; i < player.tickets; i++) {
        ticketPool.push(player);
      }
    }
  });

  const uniqueParticipants = new Set(ticketPool.map(player => player.name)).size;
  let numberOfWinners = uniqueParticipants <= 5 ? uniqueParticipants : Math.max(Math.floor(uniqueParticipants * (percentWinners / 100)), minWinners);

  let prizeDistribution = calculatePrizeDistribution(numberOfWinners, totalPrizePool).map(prize => Math.floor(prize));

  let winners = new Set();
  let attempts = 0;

  let maxWinners = uniqueParticipants > 5 ? minWinners : uniqueParticipants;

  while (winners.size < maxWinners && ticketPool.length > 0 && attempts < 1000) {
    const winnerIndex = getRandomInt(ticketPool.length);
    const winner = ticketPool[winnerIndex];

    winners.add(winner);

    attempts++;
  }

  return Array.from(winners).map((winner, index) => ({
    name: winner.name,
    prize: formatNumber(prizeDistribution[index])
  }));
}


async function endCompetition() {
  if (!isCompetitionActive) {
    console.log('There is no active competition.');
    return;
  }

  for (let i = 0; i < competitionArray.length; i++)
    if (competitionArray[i].hasPaid)
      prizePool += entryFee;

  competitionArray.forEach(calculateTickets);

  const winners = conductRaffle(prizePool);

  let descriptionText = winners.map(winner => `${winner.name} (${competitionArray[competitionArray.findIndex(player => player.name.toLowerCase() === winner.name.toLowerCase())].tickets}) - ${formatNumber(winner.prize)} coins`).join('\n');

  const winnersEmbed = new EmbedBuilder()
    .setColor('Gold')
    .setTitle('Competition Winners')
    .setDescription(`The competition has ended! Here are the winners:\n${descriptionText}`)
    .setFooter({ text: "'just get the bot from FC' - HsFearless (there was no bot)" });

  const donationEmbed = new EmbedBuilder()
    .setColor(0x55ffff)
    .setTitle('Donators')

  donatorArray.sort((a, b) => (b.donation) - (a.donation));

  let donationString = ''
  for (const donator of donatorArray) {
    donationString += donator.name + ': ' + formatNumber(donator.donation) + '\n'
  }

  donationEmbed.setDescription(`Shoutout to Everyone Who Donated To the Prize Pool!\n${donationString}`)

  const endChannel = client.channels.cache.get('1169004546014580806');

  const finalEmbeds = generateEmbeds(25, false)
  endChannel.send({ embeds: finalEmbeds})

  if (endChannel) {
    if (donatorArray.length === 0)
      endChannel.send({ embeds: [winnersEmbed] });
    else
      endChannel.send({ embeds: [winnersEmbed, donationEmbed] })
  } else {
    console.error('End of competition channel is not defined.');
  }

  resetCompetition()
}

function resetCompetition() {
  competitionArray = [];
  donatorArray = [];
  isCompetitionActive = false;
  prizePool = 0;
  startEpoch = undefined;
  endEpoch = undefined;
}