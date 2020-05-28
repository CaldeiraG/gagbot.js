/**
 * Bind a roleset to a message, and grant users roles when they react to the message
 *
 * @author Kay <kylrs00@gmail.com>
 * @license ISC - For more information, see the LICENSE.md file packaged with this file.
 * @since r20.2.0
 * @version v1.0.0
 */

const Command = require('../../../command/Command.js');
const { channel, id, str } = require('../../../command/arguments.js');
const ReactionRoles = require('../ReactionRoles.js');

module.exports = class RREnableCommand extends Command {

    /**
     * RREnableCommand constructor.
     *
     * @since r20.2.0
     * @version v1.0.0
     */
    constructor() {
        super("rrenable", "Bind a roleset to a message.", "gagbot:reactionroles:message", false, {
            channel: channel,
            message: id,
            roleset: str
        });
    }

    /**
     * Bind a roleset to a message
     *
     * @param {Client} client
     * @param {Message} message
     * @param {ArgumentList} args
     * @return {Error|boolean}
     */
    async execute(client, message, args) {
        const guild = message.guild;

        const cid = args.get('channel');
        if (!guild.channels.cache.has(cid)) {
            await message.channel.send(`Invalid channel \`<#${cid}>\`.`);
            return true;
        }
        const channel = guild.channels.cache.get(cid);

        const mid = args.get('message');
        if (!channel.messages.cache.has(mid)) {
            await message.channel.send(`Invalid message \`${mid}\`.`);
            return true;
        }
        const msg = channel.messages.cache.get(mid);

        if (msg.reactions.cache.size > 0) {
            await message.channel.send(`Existing reactions must be cleared before you can enable a new roleset for this message.`);
            return true;
        }

        const setName = args.get('roleset');

        // Get the guild doc
        const guildDoc = await ReactionRoles.getGuildDoc(client, message);
        if (!guildDoc) return true;

        // If the set doesn't exist, error
        const set = ReactionRoles.getSet(guildDoc, setName);
        if (!set) {
            await message.channel.send(`No such set \`${setName}\`.`);
            return true;
        }

        const data = guildDoc.data.reactionroles;

        let messages;
        if (!data.messages) messages = data.messages = {};

        if (messages.hasOwnProperty(mid)) {
            message.channel.send(`This message is already bound to the roleset \`${messages[mid].roleset}\``);
            return true;
        }

        messages[mid] = {
            channel: message.channel.id,
            rolset: setName,
        };

        for (let react of Object.keys(set.entries)) {
            await msg.react(react);
        }

        ReactionRoles.saveGuildDoc(guildDoc, message);

        return true;
    }

};