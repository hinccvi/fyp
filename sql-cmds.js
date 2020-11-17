module.exports.sqlWriteValue = 'INSERT INTO fyp.plant(timestamp, moisture, temperature, waterlv, phlv, health) VALUES($1, $2, $3, $4, $5, $6)';

module.exports.sqlQueryTemps = `
SELECT * 
  FROM (SELECT * FROM fyp.plant ORDER BY timestamp DESC LIMIT $1)
  AS lastRows
  ORDER BY timestamp ASC;
`;

module.exports.sqlDeleteData = `DELETE FROM fyp.plant`;

module.exports.sqlCreatTable = `
CREATE SCHEMA IF NOT EXISTS "fyp";
ALTER SCHEMA "fyp" OWNER TO "db-thong-wan-hin";
CREATE TABLE IF NOT EXISTS "fyp"."plant"(
  id serial,
  timestamp timestamp without time zone NOT NULL,
  moisture real,
  temperature real,
  waterlv real,
  phlv real,
  health real,

  PRIMARY KEY (id)
);
ALTER TABLE "fyp"."plant" OWNER to "db-thong-wan-hin";
GRANT ALL ON ALL TABLES IN SCHEMA "fyp" TO "db-thong-wan-hin";
GRANT ALL ON ALL SEQUENCES IN SCHEMA "fyp" TO "db-thong-wan-hin";
`;