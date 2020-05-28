
module.exports = class RoleSet {

    #guildDoc;
    #data;
    #set;

    constructor(client, guild, name) {
        this.client = client;
        this.guild = guild;
        this.name = name;
        this.modified = false;

        this.init();
    }

    init() {
        this.#guildDoc = client.db.guild.fetchByGuildID(this.guild.id);
        if (!this.#guildDoc.data.hasOwnProperty('reactionroles')) this.#guildDoc.data.reactionroles = {};
        const data = this.#data = this.#guildDoc.data.reactionroles;
        const sets = data.sets ?? (data.sets = {});

        if (!sets.hasOwnProperty(this.name)) {
            sets[this.name] = {
                exclusive: false,
                entries: {},
            };
        }

        this.#set = sets[this.name];
    }

    static exists(client, guild, name) {
        const guildDoc = client.db.guild.fetchByGuildID(guild.id);
        if (!guildDoc.data.hasOwnProperty('reactionroles')) guildDoc.data.reactionroles = {};
        const data = guildDoc.data.reactionroles;

        return data.hasOwnProperty('sets') && data.sets.hasOwnProperty(name);
    }

    static fetch(client, guild, name, callback) {
        let error = null, roleset = null;

        if (!RoleSet.exists(client, guild, name)) {
            error = new Error(`No such set \`${name}\`.`);
        } else {
            roleset = new RoleSet(client, guild, callback);
        }

        if (callback) return callback(error, roleset);
        return roleset;
    }

    static create(client, guild, name, callback) {
        let error = null, roleset = null;

        if (RoleSet.exists(client, guild, name)) {
            error = new Error(`The set \`${name}\` already exists.`);
        } else {
            roleset = new RoleSet(client, guild, callback);
        }

        if (callback) return callback(error, roleset);
        return roleset;
    }

    commit(callback) {
        if (this.modified) {
            this.#guildDoc.markModified(`data.reactionroles.sets.${this.name}`);
            this.#guildDoc.save(function(error) {
                if (callback) callback(error);
            });
        } else {
            if (callback) callback();
        }
    }

    entries() {
        return this.#set.entries;
    }

    getEntry(react) {
        if (this.#set.entries.hasOwnProperty(react))
            return this.#set.entries[react];

        return undefined;
    }

    addEntry(react, role, callback) {
        let error = null, entry = null;
        if (this.#set.entries.hasOwnProperty(react)) {
            error = new Error(`The roleset \`${this.name}\` already has the ${react} react.`);
        } else {
            this.modified = true;
            this.#set.entries[react] = role;
            entry = { react, role };
        }

        callback(error, entry);
    }

    updateEntry(react, role, callback) {
        let error = null,
            oldEntry = null,
            newEntry = { react, role };

        if (!this.#set.entries.hasOwnProperty(react)) {
            error = new Error(`The roleset \`${this.name}\` doesn't have the ${react} react.`);
        } else {
            this.modified = true;
            const oldRole = this.#set.entries[react];
            oldEntry = { react, oldRole };
            this.#set.entries[react] = role;
        }

        callback(error, oldEntry, newEntry);
    }

    removeEntry(react, callback) {
        let error = null, oldEntry = null;

        if (!this.#set.entries.hasOwnProperty(react)) {
            error = new Error(`The roleset \`${this.name}\` doesn't have the ${react} react.`);
        } else {
            this.modified = true;
            const oldRole = this.#set.entries[react];
            oldEntry = { react, oldRole };
            delete this.#set.entries[react];
        }

        callback(error, oldEntry);
    }

    getExclusive() {
        return this.#set.exclusive;
    }

    setExclusive(exclusive) {
        this.modified = true;
        this.#set.exclusive = exclusive;
    }

};