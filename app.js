const PORT = 8000;
import express, { json, static as expressStatic } from "express";
import { createConnection } from "mysql2/promise";
import { readFileSync, writeFileSync } from "fs";
import { createServer } from "livereload";
import connectLiveReload from "connect-livereload";
import session from "express-session";
import { MySQLStoreFactory } from "express-mysql-session";
import dotenv from "dotenv";

const app = express();

dotenv.config();

const liveReloadServer = createServer();
liveReloadServer.watch("./app/");
liveReloadServer.watch("./public/");
app.use(connectLiveReload());

//mysql -u root -p
const pool = await createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "the_prime_cut",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
const MySQLStore = MySQLStoreFactory(session);
const sessionStore = new MySQLStore({}, pool);

app.use(
  session({
    key: "the_prime_cut",
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(json());
app.use("/js", expressStatic("./public/scripts"));
app.use("/css", expressStatic("./public/css"));
app.use("/assets", expressStatic("./public/assets"));
app.use("/html", expressStatic("./app/html"));
app.use("/data", expressStatic("./app/data"));

app.get("/", (request, response) => {
  response.status(200).send(readFileSync("./app/html/index.html", "utf8"));
});

app.get("/reservations", async (request, response) => {
  //TODO
  const { date } = request.query;
  try {
    const [reservations] = await pool.execute(
      `SELECT 
        table_number,
        GROUP_CONCAT(hour SEPARATOR ', ') AS hours
      FROM reservations
      WHERE date=?
      GROUP BY table_number;`,
      [date]
    );
    console.log(`sending reservations for date: ${date}`, reservations);
    response.status(200).send(reservations);
  } catch (error) {
    console.error(`Error sending reservations for date: ${date}`, error);
    response.status(500).send(`Error sending reservations for date: ${date}`, error);
  }
});

app.post("/reservations", async (request, response) => {
  try {
    const { firstName, lastName, email, phoneNumber, date, time, table } = request.body;
    await pool.beginTransaction();

    //FIXME
    const [guestInsertResult] = await pool.execute(`
      INSERT INTO guests (first_name, last_name, email, phone_number)
      SELECT '${firstName}','${lastName}', '${email}', '${phoneNumber}'
      WHERE NOT EXISTS (
        SELECT 1 
        FROM guests 
        WHERE first_name = '${firstName}'
          AND last_name = '${lastName}'
          AND email = '${email}'
          AND phone_number = '${phoneNumber}');
    `);
    console.log(guestInsertResult);

    console.log(
      `guest: ${guestInsertResult.insertId}, table: ${table}, date: ${date}, time: ${time}`
    );

    const [reservationInsertResult] = await pool.execute(`
      INSERT INTO reservations (guest_id, table_number, date, hour)
      VALUES (${guestInsertResult.insertId}, ${table}, '${date}', ${time});
    `);
    console.log(reservationInsertResult);

    await pool.commit();
    response.status(200).send("Successfully updated reservations.");
  } catch (error) {
    await pool.rollback();
    console.error("Error updating reservations, transaction rolled back.", error);
    response.status(500).send("Error updating reservations, transaction rolled back.", error);
  }
});

app.post("/login", (request, response) => {});

// for resoure not found (404)
app.use((request, response, next) => {
  response.status(404).send(readFileSync("./app/html/404.html", "utf8"));
});

app.listen(PORT, () => {
  console.log(`The Prime Cut is listening on ${PORT}!`);
});
