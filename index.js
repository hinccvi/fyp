const mqtt = require('mqtt');
const express = require('express');
const moment = require('moment');
const { Pool } = require('pg');
const { sqlCreatTable, sqlQueryTemps, sqlWriteValue, sqlDeleteData } = require('./sql-cmds');
const app = express();

// Credentials for connecting to the postgresql server
const pgConnOpt = {
  host: '52.163.205.59',
  port: '5432',
  database: 'db-thong-wan-hin',
  user: 'da7dfc68-3954-4efb-9e86-ea3d5bdc76d4',
  password: 'Gapdtn5NJ5AsnkPMtCwlHWVni',
  max: 1,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 2000
};
// Credentials for connecting to the rabbitmq server
const mqttUri = 'mqtt://e9dae552-7e65-4468-a4f7-7ad8d93d2404%3A18beb126-286b-4b69-b6da-18b492ddcceb:X04FG0ZUUrPQeB0qqyhr@rabbitmq-001-pub.sa.wise-paas.com:1883';

// Server
const port = 3000;
app.listen(port, () => {
  logger(`Server started on port ${port}`);
});

// Connects to IotHub and Subcribes to the topic when the connection is made.
const client = mqtt.connect(mqttUri);
// Sets the topic to subscribe -> # (getting all the topic)
const topic = '#';

client.on('connect', (connack) => {
  logger('Connected to IoTHub');

  client.subscribe(topic, (err, granted) => {
    if (!err) logger(`Subscribed to ${topic}`);
  });
});

// Connecting to the Postgresql DB server
const pool = new Pool(pgConnOpt);
pool.on('error', () => logger('Lost PG connection'));

// Receives messages from the above topic. Publishes the message to another topic right away upon receiving it.
client.on('message', async (topic, message, packet) => {
  let msg = JSON.parse(message.toString());
  let time = msg.t;
  let input1 = parseFloat(msg.ai1);
  let input2 = parseFloat(msg.ai2);
  let input3 = parseFloat(msg.ai3);
  let input4 = parseFloat(msg.ai4);
  let status1 = msg.ai_st1;
  let status2 = msg.ai_st2;
  let status3 = msg.ai_st3;
  let status4 = msg.ai_st4;

  try {
    await pool.query(sqlWriteValue, [time, input1, input2, input3, input4]);
    console.log(msg);

  } catch (err) {
    console.error('Error adding data...', err.stack);
  }

});

// Other MQTT events
client.on('error', err => logger(err));
client.on('close', () => logger('[MQTT]: close'));
client.on('offline', () => logger("[MQTT]: offline"));

// Helper function
function logger(s) {
  console.log(Date() + ' -- ' + s);
}

// Creates the schema and table and sets the permission base on 'group'
app.get('/create_table', async (req, res) => {

  const msg = 'Schema and table have been created if not existed';

  pool.query(sqlCreatTable)
    .then(() => logger(msg))
    .then(() => res.send(logger(msg)))
    .catch(err => console.error('Error creating the table...', err.stack));

});

app.get('/delete_data', async (req, res) => {

  const msg = 'All data successfully deleted';

  pool.query(sqlDeleteData)
    .then(() => logger(msg))
    .then(() => res.send(logger(msg)))
    .catch(err => console.error('Error deleting the data...', err.stack));

});

app.get('/get_data/:param', async (req, res) => {

  const num = parseInt(req.params.param);

  try {
    const result = await pool.query(sqlQueryTemps, [num]);

    result.rows.map(row => {
      row.timestamp = moment(row.timestamp).format('MM-DD HH:mm:ss');
    });

    res.send({ Plant_Data: result.rows });

  } catch (err) {
    console.error('Error executing query...', err.stack);
  }

});

// app.get('/temps', async (req, res) => {
//   try {
//     const result = await pool.query(sqlQueryTemps);

//     result.rows.map(row => {
//       row.timestamp = moment(row.timestamp).format('MM-DD HH:mm:ss');
//     });

//     res.send({ temperatures: result.rows });
//   } catch (err) {
//     console.error('Error executing query...', err.stack);
//   }
// });