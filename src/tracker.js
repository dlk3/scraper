const Client = require('bittorrent-tracker');
const config = require('./../config');
const utils = require('./utils');

const updateRecord = async (knex, record) => {
	if (config.debug) {
		console.log(`${record.infoHash} - ${record.complete}:${record.incomplete}`);
	}
	await knex('torrents')
		.update({
			leechers: record.incomplete,
			searchUpdate: false,
			seeders: record.complete,
			trackerUpdated: new Date(),
		})
		.where({ infohash: record.infoHash });
};

const scrape = async (knex, records) => {
	const options = {
		announce: [config.tracker.host],
		infoHash: records.map(({ infohash }) => infohash),
	};

	const results = await new Promise((resolve, reject) => {
		try {
			Client.scrape(options, (error, data) => (error ? reject(error) : resolve(data)));
		} catch (error) {
			console.error(`${utils.timeStamp()}Error while querying tracker stats:`);
			console.error(error);
			// Do nothing
		}
	});

	if (results.infoHash) {
		await updateRecord(knex, results);
	} else {
		const hashes = Object.keys(results);

		for (let i = 0; i < hashes.length; i += 1) {
			await updateRecord(knex, results[hashes[i]]); // eslint-disable-line no-await-in-loop
		}
	}
};

const getRecords = async (knex) => {
	try {
		const newRecords = await knex('torrents')
			.select('infohash')
			.whereNull('trackerUpdated')
			.limit(config.tracker.limit);
		const newLimit = config.tracker.limit - newRecords.length;
		const age = new Date(Date.now() - 1000 * 60 * config.tracker.age);
		const outdatedRecords = await knex('torrents')
			.select('infohash')
			.where('trackerUpdated', '<', age)
			.limit(newLimit);

		return [...newRecords, ...outdatedRecords];
	} catch (error) {
		console.error(`${utils.timeStamp()}Unexpected error:`);
		console.error(error);
		return [];
	}
};

const tracker = async (knex) => {
	const records = await getRecords(knex);

	if (records.length > 0) {
		try {
			await scrape(knex, records);
		} catch (error) {
			console.error(`${utils.timeStamp()}Unexpected error:`);
			console.error(error);
			// Do nothing
		}
	}

	setTimeout(() => tracker(knex), config.tracker.frequency * 1000);
};

module.exports = tracker;
