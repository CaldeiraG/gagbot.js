
const RoleSet = require('./RoleSet.js');

module.exports = class ReactMenu {

    channel;
    message;
    roleset;

    #guildDoc;
    #data;

    constructor(client, guild, mid) {
        this.client = client;
        this.guild = guild;
        this.modified = false;
        this.enabled = false;

        this.init(mid);
    }

    async init(mid) {
        this.#guildDoc = client.db.guild.fetchByGuildID(this.guild.id);
        const data = this.#data = this.#guildDoc.data.reactionroles ?? (this.#guildDoc.data.reactionroles = {});
        const messages = data.messages ?? (data.messages = {});

        if (messages.hasOwnProperty(mid)) {
            this.enabled = true;
            this.channel = this.guild.channels.fetch(messages[mid].channel);
            this.message = this.channel.messages.fetch(mid);
        }

        this.roleset = new RoleSet(this.client, this.guild, setName);
    }

    commit(callback) {
        if (this.modified) {
            this.#guildDoc.markModified(`data.reactionroles.messages.${this.message.id}`);
            this.#guildDoc.save(function (error) {
                if (callback) callback(error);
            });
        } else {
            if (callback) callback();
        }
    }



};