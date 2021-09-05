/* eslint-disable camelcase */
const config = require('./../config');
const elasticsearch = require('elasticsearch');
const utils = require('./utils');

const client = new elasticsearch.Client({ host: `${config.elasticsearch.host}:${config.elasticsearch.port}` });
const knex = require('knex')(config.db);

const getStaleTorrents = () => knex('torrents')
	.select('infohash')
	.where('updated', '<=', knex.raw('NOW() - INTERVAL ? DAY', [config.stale.days]))
	.andWhere(function() {
		this.whereNotNull('updated')
	})
	.limit(config.stale.limit);

const deleteRecords = async (records) => {
	const body = records.reduce(
                (result, record) => [
                        ...result,
                        {
                                delete: {
                                        _id: record.infohash,
                                        _index: 'torrents',
                                },
                        },
                ],
                [],
        );
	
	const response = await client.bulk({ body });
        if (response.errors) {
                const errors = response.items.filter((item) => item.delete.error);
                console.log(errors);
        }

        const count = await knex('torrents')
                .del()
                .whereIn('infohash', records.map(({ infohash }) => infohash));
        console.log(utils.timeStamp() + 'Deleted ' + count + ' stale torrents');
} 

const cleaner = async () => {
	try {
		const stale = await getStaleTorrents();
		if (stale.length > 0) {
			await deleteRecords(stale);
		}
	} catch (error) {
		console.error(utils.timeStamp() + 'Unexpected error:');
		console.error(error);
	}
	setTimeout(() => cleaner(knex), config.search.frequency * 1000);
};

cleaner();
