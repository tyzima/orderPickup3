
const Airtable = require('airtable');

exports.handler = async function(event) {
    const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME } = process.env;
    const { orderNumber } = JSON.parse(event.body);

    Airtable.configure({
        apiKey: AIRTABLE_API_KEY
    });

    const base = Airtable.base(AIRTABLE_BASE_ID);
    const table = base(AIRTABLE_TABLE_NAME);

    try {
        const records = await table.select({
            filterByFormula: `{Order Number} = '${orderNumber}'`
        }).firstPage();

        if (records.length > 0) {
            const record = records[0];
            await table.update(record.id, { 'Stage': 'Picked Up' });
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, order: { stage: 'Picked Up' } })
            };
        } else {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Order not found.' })
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
