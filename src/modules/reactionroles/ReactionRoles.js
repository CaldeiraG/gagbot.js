/**
 * Get the db document associated with the message's guild
 *
 * @author Kay <kylrs00@gmail.com>
 * @since r20.2.0
 *
 * @param {Client} client
 * @param {Message} message
 * @returns {Document}
 */
async function getGuildDocFromMessage(client, message) {
    const guildDoc = getGuildDoc(client, message.guild);

    if (!guildDoc) {
        console.error(`Error while setting greet channel:\n  Couldn't find a guild document with {id: ${message.guild.id}}`);
        await message.channel.send(`***${client.config.errorMessage}***\n Something went wrong...`);
    }

    return guildDoc;
}

/**
 * Get the db document associated with a guild
 *
 * @author Kay <kylrs00@gmail.com>
 * @since r20.2.0
 *
 * @param {Client} client
 * @param {Guild} guild
 * @returns {Document}
 */
async function getGuildDoc(client, guild) {
    const guildDoc = await client.db.guild.findOne({id: guild.id});
    if (!guildDoc) return null;

    // Get or initialise reactionroles data object
    if (!guildDoc.data.reactionroles) guildDoc.data.reactionroles = {};

    return guildDoc;
}

/**
 * Commit any changes to the guild document to the database
 *
 * @author Kay <kylrs00@gmail.com>
 * @since r20.2.0
 *
 * @param {Document} doc
 * @param {Message} message
 * @param {string} [successMessage]
 */
function saveGuildDoc(doc, message, successMessage) {
    doc.markModified('data.reactionroles');
    doc.save(function(err) {
        if (err) {
            message.channel.send(`***${client.config.errorMessage}***\n Something went wrong...`);
            console.error(err);
            return;
        }

        if (successMessage) message.channel.send(successMessage);
    });
}

/**
 * Get a roleset object from the guild doc. Return null if the set doesn't exist.
 *
 * @author Kay <kylrs00@gmail.com>
 * @since r20.2.0
 *
 * @param {Document} guildDoc
 * @param {string} setName#
 * @return {object}
 */
function getSet(guildDoc, setName) {

    const data = guildDoc.data.reactionroles;

    // Get or initialise sets object
    if (!data.sets) data.sets = {};
    const sets = data.sets;

    // Get or initialise the given set
    if (!(setName in sets)) return null;

    return sets[setName];
}

module.exports = { getGuildDoc, saveGuildDoc, getSet };