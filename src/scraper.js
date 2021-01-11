const config = require('./../config');
const crawler = require('./crawler');
const parser = require('./parser');
const tracker = require('./tracker');
const knex = require('knex')(config.db);
const utils = require('./utils');

const getCount = async () => {
	
	try {
		const [count] = await knex('torrents').count('infohash');
		const [count2] = await knex('torrents')
			.count('infohash')
			.whereNull('trackerUpdated');
		const [count3] = await knex('torrents')
			.count('infohash')
			.whereNull('searchUpdated');

		console.log(utils.timeStamp() + `Total Torrents: ${count['count(`infohash`)']}`);
		console.log(utils.timeStamp() + `Torrents without Tracker: ${count2['count(`infohash`)']}`);
		console.log(utils.timeStamp() + `Torrents not in Search: ${count3['count(`infohash`)']}`);
	} catch (error) {
		if (error instanceof knexTimeoutError) {
			console.log(utils.timeStamp() + 'knex database connection time out');
		} else {
			console.error(utils.timeStamp() + 'Unexpected error:');
			console.error(error);
		}
	}

	setTimeout(() => getCount(), 10000);
};

const addTorrent = async (infohash, rinfo) => {
	try {
		const records = await knex('torrents').where({ infohash: infohash.toString('hex') });

		if (records.length === 0 || !records[0].name) {
			parser(infohash, rinfo, knex);
		}
	} catch (error) {
		if (config.debug) {
			console.error(error);
		}
	}
};

crawler(addTorrent);
tracker(knex);
getCount();
