/**
 * Define `reactionroles` module events.
 *
 * On messageReactAdd and messageReactRemove events,
 *
 * @author Kay <kylrs00@gmail.com>
 * @license ISC - For more information, see the LICENSE.md file packaged with this file.
 * @since r20.2.0
 * @version v1.0.0
 */

const { MessageEmbed } = require('discord.js');
const ReactionRoles = require('./ReactionRoles.js');

module.exports = {

    /**
     * Cache all previously enabled reaction role messages
     *
     * @author Kay <kylrs00@gmail.com>
     * @since r20.2.0
     *
     * @param {Client} client
     * @param {Guild} guild
     */
    async on_initGuild(client, guild) {
        // Fetch the guild document from the db
        const guildDoc = await client.db.guild.fetchByGuildID(guild.id);
        if (!guildDoc) {
            console.error(`No guild document found for server '${guild.name}'`);
            return;
        }
        const data = guildDoc.data.reactionroles ?? (guildDoc.data.reactionroles = {});


        if (data.messages) {
            for (let mid of Object.keys(data.messages)) {
                const cid = data.messages[mid].channel;
                if (guild.channels.cache.has(cid)) {
                    guild.channels.get(cid).messages
                        .fetch(mid)
                        .catch((error) => {
                            console.error(`Failed to fetch message '${mid}': \n${error}`)
                        });
                }
                else {
                    console.error(`Failed to fetch channel '${cid}'.`);
                }
            }
        }
    },

    /**
     * Create a document in the guilds collection when joining a new server
     *
     * @author Kay <kylrs00@gmail.com>
     * @since r20.2.0
     *
     * @param {Client} client
     * @param {MessageReaction} reaction
     * @param {User} user
     */
    async on_messageReactAdd(client, reaction, user) {
        if(user.bot) return;

        const { message, emoji } = reaction;

        // Fetch the guild document from the db
        const guildDoc = ReactionRoles.getGuildDoc(client, message);
        if (!guildDoc) {
            console.error(`No guild document found for server '${message.guild.name}'`);
            return;
        }

        const data = guildDoc.data.reactionroles;

        // If no roleset is attached to the message, return
        if (!data.messages || !(mid in data.messages)) return;

        const setName = data.messages[mid];

        const roleset = ReactionRoles.getSet(guildDoc, setName);

        console.log(roleset);
    },
};