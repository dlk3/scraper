const config = require('./../config');
const crawler = require('./crawler');
const parser = require('./parser');
const tracker = require('./tracker');
const knex = require('knex')(config.db);

const getCount = async () => {
	const [count] = await knex('torrents').count('infohash');
	const [count2] = await knex('torrents')
		.count('infohash')
		.whereNull('trackerUpdated');
	const [count3] = await knex('torrents')
		.count('infohash')
		.whereNull('searchUpdated');

	//  Print a timestamp with each count message - dlk
	function PadZero(num) {
		return (num >= 0 && num < 10) ? "0" + num : num + "";
	}
	var now = new Date()
	var timestamp = [now.getFullYear(), PadZero(now.getMonth() + 1), PadZero(now.getDate())].join("-") + "T" + [PadZero(now.getHours()), PadZero(now.getMinutes()), PadZero(now.getSeconds())].join(':') + " "
	
	console.log(timestamp + `Total Torrents: ${count['count(`infohash`)']}`);
	console.log(timestamp + `Torrents without Tracker: ${count2['count(`infohash`)']}`);
	console.log(timestamp + `Torrents not in Search: ${count3['count(`infohash`)']}`);
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
			console.log(error);
		}
	}
};

crawler(addTorrent);
tracker(knex);
getCount();
