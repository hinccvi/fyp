const mqtt = require('mqtt');
const express = require('express');
const moment = require('moment');
const { Pool } = require('pg');
const { sqlCreatTable, sqlQueryTemps, sqlWriteValue, sqlDeleteData } = require('./sql-cmds');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

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
  let ahealth = 0;
  let bhealth = 0;
  let chealth = 0;
  let dhealth = 0;
  let health = 0;

  let moisture = getMois();

  let temp = getTemp();

  let waterLv = getWaterLV();

  let ph = getPhLV();

  if (moisture > 30)
    ahealth = 100;
  else if (moisture > 25 && moisture < 30)
    ahealth = 75;
  else if (moisture > 20 && moisture < 25)
    ahealth = 50;
  else if (moisture > 20 && moisture < 25)
    ahealth = 25;

  if (temp > 25 && temp < 30)
    bhealth = 100;
  else if (temp > 30)
    bhealth = 75;
  else if (temp < 25)
    bhealth = 50;

  if (waterLv > 20)
    chealth = 100;
  else if (moisture > 10 && moisture < 20)
    chealth = 75;
  else if (moisture < 10)
    chealth = 25;

  if (ph > 7 && ph < 8.5)
    dhealth = 100;
  else if (moisture > 6 && moisture < 7)
    dhealth = 75;
  else if (moisture > 8.5 && moisture < 9.5)
    dhealth = 75;
  else if (moisture < 6)
    dhealth = 25;
  else if (moisture > 9.5)
    dhealth = 25;

  health = (ahealth + bhealth + chealth + dhealth) / 4;

  logger('Moisture: ' + moisture + ' Temperature: ' + temp + ' Water Level: ' + waterLv + ' PH: ' + ph);

  if (time != null) {
    try {
      await pool.query(sqlWriteValue, [time, moisture, temp, waterLv, ph, health]);
    } catch (err) {
      console.error('Error adding data...', err.stack);
    }
  }

});

// Other MQTT events
client.on('error', err => logger(err));
client.on('close', () => logger('[MQTT]: close'));
client.on('offline', () => logger("[MQTT]: offline"));

//xxxdata
let mois = 34;
let temp = 28;
let wlv = 22;
let plv = 8.7;

function getRand() {
  return ((Math.random() * 10) + 1);
}

function getTime(){
  let d = new Date();
  console.log(d.getHours());
  return(d.getHours());
}

// Helper function
function logger(s) {
  console.log(Date() + ' -- ' + s);
}

function getMois() {

  if (getRand() > 5) {
    if (getRand() % 2 == 0)
      return mois + (getRand() / 10);
    else
      return mois - (getRand() / 10);
  }
  else
    return mois;

}

function getTemp() {

  if(getTime() >= 0 && getTime() < 4)
     return temp - 2;
  else if(getTime() > 4 && getTime() < 6)
    return temp - 1;
  else if(getTime() > 6 && getTime() < 8)
    return temp + 1;
  else if(getTime() > 8)
    return temp + 2;

}

function getWaterLV() {

  if (getRand() > 5) {
    if (getRand() % 2 == 0)
      return wlv + (getRand() / 10);
    else
      return wlv - (getRand() / 10);
  }
  else
    return wlv;


}

function getPhLV() {

  return plv;

}

app.get('/', async (req, res) => {

  res.status(200).send('Working fine.');

});

app.use(cors());

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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

app.post('/api/data', async(req ,res) => {

  const data = req.body;

  console.log(data);

});