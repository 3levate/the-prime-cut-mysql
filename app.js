const PORT = 8000;
import express, { json, static as expressStatic } from "express";
import { createPool } from "mysql2/promise";
import { readFileSync } from "fs";
import { createServer } from "livereload";
import connectLiveReload from "connect-livereload";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import dotenv from "dotenv";

dotenv.config();

const app = express();

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
    response.status(200).send(JSON.stringify(reservations));
  } catch (error) {
    console.error(`Error sending reservations for date: ${date}`, error);
    response
      .status(500)
      .send(JSON.stringify(`Error sending reservations for date: ${date}`, error));
  }
});

app.post("/reservations", async (request, response) => {
  let connection;
  try {
    const { date, time, table } = request.body;
    const { userId } = request.session;
    connection = await pool.getConnection();

    await connection.beginTransaction();
    const [reservationInsertResult] = await connection.execute(
      `
      INSERT INTO reservations (guest_id, table_number, date, hour)
      VALUES (?, ?, ?, ?);
    `,
      [userId, table, date, time]
    );
    console.log(reservationInsertResult);
    await connection.commit();

    response.status(200).send(JSON.stringify("Successfully updated reservations"));
  } catch (error) {
    await connection.rollback();

    console.error(`${error.name} updating reservations, transaction rolled back`, error);
    response
      .status(500)
      .send(JSON.stringify(`${error.name} updating reservations, transaction rolled back`, error));
  } finally {
    connection.release();
  }
});

app.post("/login", async (request, response) => {
  const { email: requestEmail, password: requestPassword } = request.body;
  const [loginQueryResult] = await pool.execute(
    `
    SELECT ID, password
    FROM guests
    WHERE email = ?;
  `,
    [requestEmail]
  );
  console.log("loginQueryResult", loginQueryResult);

  if (loginQueryResult.length > 0) {
    const guest = loginQueryResult[0];

    if (guest.password == requestPassword) {
      console.log("passwords match");
      request.session.userId = guest.ID;
      response.status(200).send(JSON.stringify("Login Successful", guest.ID));
    } else {
      response.status(401).send(JSON.stringify("Login Failed, incorrect password"));
    }
  } else {
    response.status(404).send(JSON.stringify("Error: Guest not found"));
  }
});

app.post("/signup", async (request, response) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { firstName, lastName, email, nullPhoneNumber, password } = request.body;
    for (const key in request.body) {
      console.log(key, request.body[key]);
    }

    await connection.beginTransaction();
    const [guestInsertResult] = await connection.execute(
      `INSERT INTO guests (first_name, last_name, email, phone_number, password)
       VALUES (?, ?, ?, ?, ?);`,
      [firstName, lastName, email, nullPhoneNumber, password]
    );
    await connection.commit();

    request.session.userId = guestInsertResult.insertId;
    response
      .status(200)
      .send(JSON.stringify("Successfully created account and logged in", guestInsertResult));
  } catch (error) {
    await connection.rollback();

    console.error(`${error.name} while creating account, transaction rolled back`, error);
    response
      .status(500)
      .send(JSON.stringify(`${error.name} while creating account, transaction rolled back`, error));
  } finally {
    connection.release();
  }
});

app.get("/isauthenticated", (request, response) => {
  request?.session?.userId
    ? response.status(200).send(JSON.stringify("User has valid session"))
    : response.status(401).send(JSON.stringify("Session does not exist or is invalid"));
});

app.get("/get-guest-details", async (request, response) => {
  const { userId } = request.session;
  try {
    const [guest] = await pool.execute(
      `
      SELECT *
      FROM guests
      WHERE ID = ?;
      `,
      [userId]
    );
    console.log("guest", guest[0]);
    response.status(200).send(JSON.stringify(guest[0]));
  } catch (error) {
    console.error(`${error.name} while getting guest details`, error);
    response.status(500).send(JSON.stringify(`${error.name} while getting guest details`, error));
  }
});

// for resoure not found (404)
app.use((request, response, next) => {
  response.status(404).send(readFileSync("./app/html/404.html", "utf8"));
});

app.listen(PORT, () => {
  console.log(`The Prime Cut is listening on ${PORT}!`);
});
