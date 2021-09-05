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
                if (config.debug) {
			const [count4] = await knex('torrents')
                        	.count('infohash')
	                        .where('updated', '<', knex.raw('NOW() - INTERVAL ? DAY', [config.stale.days]))
        	                .andWhere(function() {
                	                this.whereNotNull('updated')
                        	});
		}
		console.log(utils.timeStamp() + `Total Torrents: ${count['count(`infohash`)']}`);
		console.log(utils.timeStamp() + `Torrents without Tracker: ${count2['count(`infohash`)']}`);
		console.log(utils.timeStamp() + `Torrents not in elasticsearch index: ${count3['count(`infohash`)']}`);
                if (config.debug) {
                	console.log(utils.timeStamp() + `Stale Torrents: ${count4['count(`infohash`)']}`);
		}

	} catch (error) {
		console.error(utils.timeStamp() + 'Unexpected error:');
		console.error(error);
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
