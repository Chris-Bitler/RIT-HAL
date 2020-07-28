/**
 * This file is part of RIT-HAL.
 *
 * RIT-HAL is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * RIT-HAL is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with RIT-HAL.  If not, see <https://www.gnu.org/licenses/>.
 */

const db = require("../Database");
const moment = require('moment-timezone');

const MUTED_ID = "537412526116306954";

let mutes = [], bans = [];

const muteUser = (memberToMute, muter, reason, expiration, loading = false) => {
    if (memberToMute && !memberToMute.roles.cache.get(MUTED_ID) && !loading) {
        memberToMute.roles.add(MUTED_ID);
    }

    const expirationDateTime = Date.now() + expiration;
    const existingMute = mutes.filter((mute) => mute.memberId === memberToMute.id);

    if (existingMute) {
        mutes = mutes.filter((mute) => mute.memberId !== memberToMute.id);
    }

    mutes.push({
        memberId: memberToMute.id,
        muterId: muter.id,
        reason,
        expiration: expirationDateTime
    });

    if (!loading) {
        insertPunishmentToDB(memberToMute, muter, "mute", reason, expirationDateTime);
    }

    return true;
};

const banUser = (memberToBan, banner, reason, expiration, loading = false) => {
    const expirationDateTime = Date.now() + expiration;
    const existingBan = bans.filter((ban) => ban.memberId === memberToBan.id);

    if (existingBan) {
        bans = bans.filter((ban) => ban.memberId !== memberToBan.id);
    }

    bans.push({
        memberId: memberToBan.id,
        bannerId: banner.id,
        reason,
        expiration: expirationDateTime
    });

    const expirationDateString = moment.tz(expirationDateTime, "America/New_York").format("MMMM Do YYYY, h:mm:ss a");

    if (!loading) {
        memberToBan.send("You have been banned from the RIT discord for _" + reason.trim() + "_ by **" + banner.displayName + "** until " + expirationDateString).then(() => {
            memberToBan.ban({reason: reason});
            insertPunishmentToDB(memberToBan, banner, "ban", reason, expirationDateTime);
        }).catch((err) => {
            banner.send("An error occurred when trying to kick that user.");
            insertPunishmentToDB(memberToBan, banner, "ban", reason, expirationDateTime);
            memberToBan.ban({reason: reason});
        });
    }

    return true;
};

const unbanUser = (guild, memberToUnbanId, automatic = false) => {
    let userBanned = false;
    bans = bans.filter((ban) => {
        if (ban.memberId === memberToUnbanId) {
            userBanned = true;
            return false;
        }

        return true;
    });

    if (userBanned) {
        if (automatic) {
            guild.unban(memberToUnbanId);
        }
        cancelPunishmentInDB(memberToUnbanId, "ban");
        return true;
    } else {
        return false;
    }
};

const unmuteUser = (memberToUnmute) => {
    let userMuted = false;
    mutes = mutes.filter((mute) => {
        if (mute.memberId === memberToUnmute.id) {
            userMuted = true;
            return false;
        }

        return true;
    });

    if (userMuted) {
        memberToUnmute.roles.remove(MUTED_ID);
        cancelPunishmentInDB(memberToUnmute.id, "mute");
        return true;
    } else {
        return false;
    }
};

const kickUser = (memberToKick, kicker, reason) => {
    // Note: This messaging has to be handled here because it can't be sent after the user is kicked
    memberToKick.send("You have been kicked from the RIT discord for _" + reason.trim() + "_ by **" + kicker.displayName + "**").then(() => {
        insertPunishmentToDB(memberToKick, kicker, "kick", reason, 0, 0);
        memberToKick.kick(reason.trim());
    }).catch((err) => {
        kicker.send("An error occurred when trying to kick that user.");
        insertPunishmentToDB(memberToKick, kicker, "kick", reason, 0, 0);
        memberToKick.kick(reason.trim());
    });
};

const warnUser = (memberToWarn, warner, reason) => {
    memberToWarn.send("You have been warned by **" + warner.displayName + "** in the RIT discord for _" + reason.trim() + "_.").then(() => {
        insertPunishmentToDB(memberToWarn, warner, "warn", reason, 0, 0);
    }).catch((err) => {
        warner.send("An error occurred when trying to warn that user.");
        insertPunishmentToDB(memberToWarn, warner, "warn", reason, 0, 0);
    });
};

const isUserMuted = (member) => {
    return mutes.some((mute) => mute.memberId === member.id);
};

const reassignUserMutedRole = (member) => {
    member.roles.add(MUTED_ID);
};

const insertPunishmentToDB = (target, punisher, type, reason, expiration, active = 1) => {
    db.database.serialize(() => {
        const stmt = db.database.prepare("INSERT INTO `punishments` (userId, userName, punisherId, punisherName, type, reason, expiration, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        stmt.run(
            target.id,
            target.toString(),
            punisher.id,
            punisher.toString(),
            type,
            reason,
            expiration,
            active
        );
    });
};

const cancelPunishmentInDB = (targetId, type) => {
    db.database.serialize(() => {
        const stmt = db.database.prepare("UPDATE `punishments` SET `active` = 0 WHERE `userId` = ? AND `type` = ?");
        stmt.run(
            targetId,
            type
        );
    });
};

const loadPunishmentsFromDB = () => {
    db.database.serialize(() => {
        db.database.get("SELECT * FROM `punishments` WHERE `active` = 1 ORDER BY `id` ASC", [], (err, row) => {
            if (row) {
                switch (row.type) {
                    case "mute":
                        mutes.push({
                            memberId: row.userId,
                            muterId: row.punisherId,
                            reason: row.reason,
                            expiration: row.expiration
                        });
                        break;
                    case "ban":
                        bans.push({
                            memberId: row.userId,
                            bannerId: row.punisherId,
                            reason: row.reason,
                            expiration: row.expiration
                        });
                        break;
                    default:
                        break;
                }
            }
        });
    });
};

const tickPunishments = (client) => {
    mutes.filter((mute) => Date.now() > mute.expiration).forEach((filteredMute) => {
        client.guilds.cache.get("401908664018927626").members.fetch(filteredMute.memberId).then((member) => {
            console.log("Unumuting " + member.id);
            unmuteUser(member);
        }).catch((err) => {
            console.log(err);
            mutes = mutes.filter((mute) => filteredMute.memberId !== mute.memberId);
            cancelPunishmentInDB(filteredMute.memberId, "mute");
        });
    });

    bans.filter((ban) => Date.now() > ban.expiration).forEach((ban) => {
        unbanUser(client.guilds.cache.get("401908664018927626"), ban.memberId);
    });
};

const fetchPunishments = (id) => {
    return new Promise((resolve, reject) => {
        id = `%${id}%`;
        db.database.all("SELECT * FROM `punishments` WHERE username LIKE ?", [id], (err, rows) => {
            resolve(rows);
        });
    });
};

module.exports = {
    muteUser,
    unmuteUser,
    MUTED_ID,
    isUserMuted,
    reassignUserMutedRole,
    loadPunishmentsFromDB,
    tickPunishments,
    kickUser,
    banUser,
    unbanUser,
    warnUser,
    fetchPunishments
};