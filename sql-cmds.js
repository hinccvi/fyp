module.exports.sqlWriteValue = 'INSERT INTO fyp.plant(timestamp, input_1, input_2, input_3, input_4) VALUES($1, $2, $3, $4, $5)';

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
  timestamp timestamp with time zone NOT NULL,
  input_1 real,
  input_2 real,
  input_3 real,
  input_4 real,
  PRIMARY KEY (id)
);
ALTER TABLE "fyp"."plant" OWNER to "db-thong-wan-hin";
GRANT ALL ON ALL TABLES IN SCHEMA "fyp" TO "db-thong-wan-hin";
GRANT ALL ON ALL SEQUENCES IN SCHEMA "fyp" TO "db-thong-wan-hin";
`;