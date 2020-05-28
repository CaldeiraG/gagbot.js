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
const RoleSet = require('../RoleSet.js');

module.exports = class RRSetCommand extends Command {

    /**
     * RRSetCommand constructor
     *
     * @author Kay <kylrs00@gmail.com>
     * @since r20.2.0
     */
    constructor() {
        super("rrset", "Manipulate rolesets for reaction menus.", "gagbot:reactionroles:roleset", false, {
            cmd: choice(i('add'), i('update'), i('delete'), i('drop'), i('list'), i('togglex')),
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
                return this.addEntry(client, message, args);
            case 'update':
                return this.updateEntry(client, message, args);
            case 'delete':
                return this.deleteEntry(client, message, args);
            case 'drop':
                return this.dropSet(client, message, args);
            case 'list':
                return this.listSet(client, message, args);
            case 'togglex':
                return this.toggleExclusive(client, message, args);
        }

        return false;
    }

    /**
     * Add or update an entry in a specified roleset
     *
     * @author Kay <kylrs00@gmail.com>
     * @since r20.2.0
     *
     * @param {Client} client
     * @param {Message} message
     * @param {ArgumentList} args
     * @returns {boolean}
     */
    async addEntry(client, message, args) {

        if (!args.get('react') || !args.get('role')) return false;

        const roleset = new RoleSet(client, message.guild, args.get('set'));
        roleset.addEntry(args.get('react'), args.get('role'), function(err, set) {
            if (err) {
                message.channel.send(err.message);
                console.error(err);
                return;
            }

            roleset.commit(function() {
                message.channel.send(`Added ${react} to \`${set.name}\`.`)
            });
        });

        return true;
    }

    /**
     * Add or update an entry in a specified roleset
     *
     * @author Kay <kylrs00@gmail.com>
     * @since r20.2.0
     *
     * @param {Client} client
     * @param {Message} message
     * @param {ArgumentList} args
     * @returns {boolean}
     */
    async updateEntry(client, message, args) {

        if (!args.get('react') || !args.get('role')) return false;

        RoleSet.fetch(client, message.guild, args.get('set'), (err, roleset) => {
            if (err) {
                message.channel.send(err.message);
                console.error(err);
                return;
            }

            roleset.updateEntry(args.get('react'), args.get('role'), (err) => {
                if (err) {
                    message.channel.send(err.message);
                    console.error(err);
                    return;
                }

                roleset.commit(() => {
                    message.channel.send(`Added ${react} to \`${setName}\`.`)
                });
            });
        });


        return true;
    }

    /**
     * Remove an entry from a roleset
     *
     * @author Kay <kylrs00@gmail.com>
     * @since r20.2.0
     *
     * @param {Client} client
     * @param {Message} message
     * @param {ArgumentList} args
     * @returns {boolean}
     */
    async deleteEntry(client, message, args) {

        if (!args.get('react')) return false;

        const guildDoc = await ReactionRoles.getGuildDoc(client, message);
        if (!guildDoc) return true;

        const setName = args.get("set");
        const set = ReactionRoles.getSet(guildDoc, setName);

        if (set === null) {
            await message.channel.send(`No such set \`${setName}\`.`);
            return true;
        }

        const react = args.get('react');

        if (!set.entries.hasOwnProperty(react)) {
            await message.channel.send(`The set \`${setName}\` has no reaction ${react}.`);
            return true;
        }

        // Remove the reaction role from the set
        delete set.entries[react];

        // If the set is now empty, delete it
        if (!Object.entries(set.entries).length) {
            delete guildDoc.data.reactionroles.sets[setName];
        }

        // Commit the change
        this.saveGuildDoc(guildDoc, message, `Deleted ${react} from \`${setName}\`.`);

        return true;
    }

    /**
     * List all entries in a roleset
     *
     * @author Kay <kylrs00@gmail.com>
     * @since r20.2.0
     *
     * @param {Client} client
     * @param {Message} message
     * @param {ArgumentList} args
     * @returns {boolean}
     */
    async listSet(client, message, args) {
        const guildDoc = await ReactionRoles.getGuildDoc(client, message);
        if (!guildDoc) return true;

        const setName = args.get("set");
        const set = ReactionRoles.getSet(guildDoc, setName);

        if (set === null) {
            await message.channel.send(`No such set \`${setName}\`.`);
            return true;
        }

        const reacts = Object.keys(set.entries);
        if (!reacts.length) {
            await message.channel.send(`There are no items in the set \`${setName}\`.`);
            return true;
        }

        let msg = `**Reaction Roles in \`${setName}\`:**\n`;
        for (let react of reacts) {
            const role = message.guild.roles.cache.get(set.entries[react]);
            msg += `${react} grants ${role}\n`;
        }
        msg += "";
        await message.channel.send(msg);

        return true;
    }

    /**
     * Delete a roleset
     *
     * @author Kay <kylrs00@gmail.com>
     * @since r20.2.0
     *
     * @param {Client} client
     * @param {Message} message
     * @param {ArgumentList} args
     * @returns {boolean}
     */
    async dropSet(client, message, args) {
        const guildDoc = await ReactionRoles.getGuildDoc(client, message);
        if (!guildDoc) return true;

        const setName = args.get("set");

        // If the set doesn't exist, error
        if (!ReactionRoles.getSet(guildDoc, setName)) {
            await message.channel.send(`No such set \`${setName}\`.`);
            return true;
        }

        // Delete the set
        delete guildDoc.data.reactionroles.sets[setName];

        // Commit the change
        ReactionRoles.saveGuildDoc(guildDoc, message, `Cleared the set ${setName}.`);

        return true;
    }

    /**
     * Toggle whether more than one role can be chosen from a roleset
     *
     * @author Kay <kylrs00@gmail.com>
     * @since r20.2.0
     *
     * @param {Client} client
     * @param {Message} message
     * @param {ArgumentList} args
     * @returns {boolean}
     */
    async toggleExclusive(client, message, args) {
        const guildDoc = await ReactionRoles.getGuildDoc(client, message);
        if (!guildDoc) return true;

        const setName = args.get("set");
        const set = ReactionRoles.getSet(guildDoc, setName);

        // If the set doesn't exist, error
        if (!set) {
            await message.channel.send(`No such set \`${setName}\`.`);
            return true;
        }

        // Toggle whether the set is exclusive or not.
        set.exclusive = !set.exclusive;

        // Commit the change
        const state = set.exclusive ? "now" : "no longer ";
        ReactionRoles.saveGuildDoc(guildDoc, message, `The set \`${setName}\` is ${state} exclusive.`);

        return true;
    }

};