exports.up = async (knex) => {
	await knex.raw('ALTER TABLE `torrents` CHANGE `files` `files` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL');
	await knex.raw('ALTER TABLE `torrents` CHANGE `length` `length` BIGINT(20) NULL DEFAULT NULL');
};

exports.down = async (knex) => {
	await knex.raw('ALTER TABLE `torrents` CHANGE `files` `files` TEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL');
	await knex.raw('ALTER TABLE `torrents` CHANGE `length` `length` INT(11) NULL DEFAULT NULL');
};
