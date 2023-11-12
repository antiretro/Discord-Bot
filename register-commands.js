require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');


module.exports.competitionGoals = new Map([
  ["Wheat", "WHEAT"],
  ["Carrot", "CARROT_ITEM"],
  ["Potato", "POTATO_ITEM"],
  ['Pumpkin', 'PUMPKIN'],
  ["Melon", "MELON"],
  ["Seeds", "SEEDS"],
  ["Mushroom", "MUSHROOM_COLLECTION"],
  ["Cocoa Beans", "INK_SACK:3"],
  ["Cactus", "CACTUS"],
  ["Sugar Cane", "SUGAR_CANE"],
  ["Feather", "FEATHER"],
  ["Leather", "LEATHER"],
  ["Raw Porkchop", "PORK"],
  ["Raw Chicken", "RAW_CHICKEN"],
  ["Mutton", "MUTTON"],
  ["Raw Rabbit", "RABBIT"],
  ["Nether Wart", "NETHER_STALK"],
  ["Cobblestone", "COBBLESTONE"],
  ["Coal", "COAL"],
  ["Iron Ingot", "IRON_INGOT"],
  ["Gold Ingot", "GOLD_INGOT"],
  ["Diamond", "DIAMOND"],
  ["Lapis Lazuli", "INK_SACK:4"],
  ["Emerald", "EMERALD"],
  ["Redstone", "REDSTONE"],
  ["Nether Quartz", "QUARTZ"],
  ["Obsidian", "OBSIDIAN"],
  ["Glowstone Dust", "GLOWSTONE_DUST"],
  ["Gravel", "GRAVEL"],
  ["Ice", "ICE"],
  ["Netherrack", "NETHERRACK"],
  ["Sand", "SAND"],
  ["End Stone", "ENDER_STONE"],
  ["Mithril", "MITHRIL_ORE"],
  ["Hard Stone", "HARD_STONE"],
  ["Gemstone", "GEMSTONE_COLLECTION"],
  ["Mycelium", "MYCEL"],
  ["Red Sand", "SAND:1"],
  ["Sulphur", "SULPHER_ORE"],
  ["Rotten Flesh", "ROTTEN_FLESH"],
  ["Bone", "BONE"],
  ["String", "STRING"],
  ["Spider Eye", "SPIDER_EYE"],
  ["Gunpowder", "SULPHUR"],
  ["Ender Pearl", "ENDER_PEARL"],
  ["Ghast Tear", "GHAST_TEAR"],
  ["Slimeball", "SLIME_BALL"],
  ["Blaze Rod", "BLAZE_ROD"],
  ["Magma Cream", "MAGMA_CREAM"],
  ["Chili Pepper", "CHILI_PEPPER"],
  ["Oak Wood", "LOG"],
  ["Spruce Wood", "LOG:1"],
  ["Birch Wood", "LOG:2"],
  ["Dark Oak Wood", "LOG_2:1"],
  ["Acacia Wood", "LOG_2"],
  ["Jungle Wood", "LOG:3"],
  ["Raw Fish", "RAW_FISH"],
  ["Raw Salmon", "RAW_FISH:1"],
  ["Clownfish", "RAW_FISH:2"],
  ["Pufferfish", "RAW_FISH:3"],
  ["Prismarine Shard", "PRISMARINE_SHARD"],
  ["Prismarine Crystals", "PRISMARINE_CRYSTALS"],
  ["Clay", "CLAY_BALL"],
  ["Lily Pad", "WATER_LILY"],
  ["Ink Sac", "INK_SACK"],
  ["Sponge", "SPONGE"],
  ["Magmafish", "MAGMA_FISH"],
  ["Agaricus Cap", "AGRAICUS_CAP"],
  ["Caducous Stem", "CADUCOUS_STEM"],
  ["Half-Eaten Carrot", "HALF_EATEN_CARROT"],
  ["Hemovibe", "HEMOVIBE"],
  ["Living Metal Heart", "METAL_HEART"],
  ["Wilted Berberis", "WILTED_BERBERIS"],
]);

const commands = [
  {
    name: 'join',
    description: 'Joins The Guild Competition.',
    options: [
      {
        name: 'minecraft-ign',
        description: 'Provide Your Minecraft IGN.',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'profile-name',
        description: 'Provide Your Profile Name (fruit)',
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: 'Apple', value: 'Apple' },
          { name: 'Banana', value: 'Banana' },
          { name: 'Blueberry', value: 'Blueberry' },
          { name: 'Cucumber', value: 'Cucumber' },
          { name: 'Coconut', value: 'Coconut' },
          { name: 'Grapes', value: 'Grapes' },
          { name: 'Kiwi', value: 'Kiwi' },
          { name: 'Lemon', value: 'Lemon' },
          { name: 'Lime', value: 'Lime' },
          { name: 'Mango', value: 'Mango' },
          { name: 'Orange', value: 'Orange' },
          { name: 'Papaya', value: 'Papaya' },
          { name: 'Pineapple', value: 'Pineapple' },
          { name: 'Peach', value: 'Peach' },
          { name: 'Pear', value: 'Pear' },
          { name: 'Pomegranate', value: 'Pomegranate' },
          { name: 'Raspberry', value: 'Raspberry' },
          { name: 'Strawberry', value: 'Strawberry' },
          { name: 'Tomato', value: 'Tomato' },
          { name: 'Watermelon', value: 'Watermelon' },
          { name: 'Zucchini', value: 'Zucchini' },
        ]
      }
    ]
  },
  {
    name: 'start',
    description: 'Starts the Competition With a Start and End Date and Time',
    options: [
      {
        name: 'start-date',
        description: 'The Start Date and Time of the cCmpetition (YYYY-MM-DD HH:mm in UTC)',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'end-date',
        description: 'The End Date and Time of the Competition (YYYY-MM-DD HH:mm in UTC)',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'collection-tracked',
        description: 'The Collection to Track For the Competition',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'collection-per-ticket',
        description: 'How Much Collection You Need To Gain Per Ticket In Raffle',
        type: ApplicationCommandOptionType.Integer,
        required: true,
      },
      {
        name: 'entry-fee',
        description: 'Coins To Enter Competition',
        type: ApplicationCommandOptionType.Integer,
        required: true,
      }

    ]
  },
  {
    name: 'verify',
    description: 'Verifies a player\'s participation in the competition',
    options: [
      {
        name: 'minecraft-ign',
        description: 'The Minecraft IGN of the player to verify',
        type: ApplicationCommandOptionType.String,
        required: true,
      }
    ]
  },
  {
    name: 'standings',
    description: 'Displays Current Collection and Position in the Guild Competition',
    options: [
      {
        name: 'minecraft-ign',
        description: 'Enter Minecraft IGN',
        type: ApplicationCommandOptionType.String,

      }
    ]
  },
  {
    name: 'donation',
    description: 'Adds a Donation To Prize Pool',
    options: [
      {
        name: 'minecraft-ign',
        description: 'Enter Minecraft IGN',
        type: ApplicationCommandOptionType.String,
        required: true,

      },
      {
        name: 'donation-amount',
        description: 'Adds This Amount of Money to the Prize Pool',
        type: ApplicationCommandOptionType.Integer,
        required: true,

      },
    ]
  },
  {
    name: 'cancel',
    description: 'Cancel the Competition'
  }
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();