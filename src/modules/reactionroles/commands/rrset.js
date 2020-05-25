/**
 * Manipulate a role set for reaction roles.
 *
 * @author Kay <kylrs00@gmail.com>
 * @license ISC - For more information, see the LICENSE.md file packaged with this file.
 * @since r20.2.0
 * @version v1.0.0
 */

const Command = require('../../../command/Command.js');
const { choice, i, str, optional, emoji, role } = require('../../../command/arguments.js');

module.exports = class RRSetCommand extends Command {

    /**
     * RRSetCommand constructor
     *
     * @author Kay <kylrs00@gmail.com>
     * @since r20.2.0
     */
    constructor() {
        super("rrset", "Manipulate rolesets for reaction menus.", "gagbot:reactionroles:roleset", false, {
            cmd: choice(i('add'), i('del'), i('clear'), i('update'), i('list')),
            set: str,
            react: optional(emoji),
            role: optional(role),
        });
    }

    /**
     * Manipulate a roleset
     *   - add : Add an emoji/role pair to the set
     *   - update : Change the role granted by an existing emoji
     *   - del : Remove an emoji/role pair from the set
     *   - clear : Remove all emojis from the set
     *   - list : Display all reacts and their corresponding roles in a given set
     *
     * @author Kay <kylrs00@gmail.com>
     * @since r20.2.0
     *
     * @param {Client} client
     * @param {Message} message
     * @param {ArgumentList} args
     * @returns {boolean}
     */
    async execute(client, message, args) {

        switch (args.get('cmd')) {
            case 'add':
                return this.insertEntry(client, message, args, false);
            case 'update':
                return this.insertEntry(client, message, args, true);
            case 'del':
                return this.deleteEntry(client, message, args);
            case 'clear':
                return this.clearSet(client, message, args);
            case 'list':
                return this.listSet(client, message, args);
        }

        return false;
    }

    async getGuildDoc(client, message) {
       const guildDoc = await client.db.guild.findOne({id: message.guild.id});
       if (!guildDoc) {
           console.error(`Error while setting greet channel:\n  Couldn't find a guild document with {id: ${message.guild.id}}`);
           await message.channel.send(`***${client.config.errorMessage}***\n Something went wrong...`);
       }
       return guildDoc;
    }

    saveGuildDoc(doc, callback) {
        doc.markModified('data.reactionroles');
        doc.save(callback);
    }

    getSet(guildDoc, setName) {
        // Get or initialise reactionroles data object
        if (!guildDoc.data.reactionroles) guildDoc.data.reactionroles = {};
        const data = guildDoc.data.reactionroles;

        // Get or initialise sets object
        if (!data.sets) data.sets = {};
        const sets = data.sets;


        // Get or initialise the given set
        if (!(setName in sets)) return null;

        return sets[setName];
    }

    async insertEntry(client, message, args, update) {

        if (!args.get('react') || !args.get('role')) return false;

        const guildDoc = await this.getGuildDoc(client, message);
        if (!guildDoc) return true;

        const setName = args.get('set');
        const react = args.get('react');
        const role = args.get('role');

        // Get or create the given roleset
        let set = this.getSet(guildDoc, setName);
        if (set === null) set = guildDoc.data.reactionroles.sets[setName] = {};

        // If adding, and the set already has the given emoji, error
        if (!update && set.hasOwnProperty(react)) {
            await message.channel.send(`The ${react} emoji is already in \`${setName}\`!`);
            return true;
        }

        // If updating, and the set doesn't have the given emoji, error
        if (update && !set.hasOwnProperty(react)) {
            await message.channel.send(`The set \`${setName}\` doesn't have the emoji ${react}.`);
            return true;
        }

        let oldRole;
        if (update) oldRole = set[react];

        // Add the reaction role
        set[react] = role;

        // Commit the change
        this.saveGuildDoc(guildDoc, function(err) {
            if (err) {
                message.channel.send(`***${client.config.errorMessage}***\n Something went wrong...`);
                console.error(err);
                return;
            }

            if (update) message.channel.send(`Updated <@&${oldRole}> to <@&${role}> in \`${setName}\``);
            else message.channel.send(`Added ${react} to \`${setName}\`.`);
        });
        return true;
    }

    async deleteEntry(client, message, args) {

        if (!args.get('react')) return false;

        const guildDoc = await this.getGuildDoc(client, message);
        if (!guildDoc) return true;

        const setName = args.get("set");
        const set = this.getSet(guildDoc, setName);

        if (set === null) {
            await message.channel.send(`No such set \`${setName}\`.`);
            return true;
        }

        const react = args.get('react');

        if (!set.hasOwnProperty(react)) {
            await message.channel.send(`The set \`${setName}\` has no reaction ${react}.`);
            return true;
        }

        // Remove the reaction role from the set
        delete set[react];

        // If the set is now empty, delete it
        if (!Object.entries(set).length) {
            delete guildDoc.data.reactionroles.sets[setName];
        }

        // Commit the change
        this.saveGuildDoc(guildDoc, function(err) {
            if (err) {
                message.channel.send(`***${client.config.errorMessage}***\n Something went wrong...`);
                console.error(err);
                return;
            }

            message.channel.send(`Deleted ${react} from \`${setName}\`.`);
        });
        return true;
    }

    async listSet(client, message, args) {
        const guildDoc = await this.getGuildDoc(client, message);
        if (!guildDoc) return true;

        const setName = args.get("set");
        const set = this.getSet(guildDoc, setName);

        if (set === null) {
            await message.channel.send(`No such set \`${setName}\`.`);
            return true;
        }

        const reacts = Object.keys(set);
        if (!reacts.length) {
            await message.channel.send(`There are no items in the set \`${setName}\`.`);
            return true;
        }

        let msg = `**Reaction Roles in \`${setName}\`:**\n`;
        for (let react of reacts) {
            const role = message.guild.roles.cache.get(set[react]);
            msg += `${react} grants ${role}\n`;
        }
        msg += "";
        await message.channel.send(msg);

        return true;
    }

    async clearSet(client, message, args) {
        const guildDoc = await this.getGuildDoc(client, message);
        if (!guildDoc) return true;

        const setName = args.get("set");

        // If the set doesn't exist, error
        if (!this.getSet(guildDoc, setName)) {
            await message.channel.send(`No such set \`${setName}\`.`);
            return true;
        }

        // Delete the set
        delete guildDoc.data.reactionroles.sets[setName];

        // Commit the change
        this.saveGuildDoc(guildDoc, function(err) {
            if (err) {
                message.channel.send(`***${client.config.errorMessage}***\n Something went wrong...`);
                console.error(err);
                return;
            }

            message.channel.send(`Cleared the set ${setName}.`);
        });

        return true;
    }
};