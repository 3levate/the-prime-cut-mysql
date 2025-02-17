const PORT = 8000;
import express, { json, static as expressStatic } from "express";
import { createConnection } from "mysql2/promise";
const app = express();
import { readFileSync, writeFileSync } from "fs";
import { createServer } from "livereload";
import connectLiveReload from "connect-livereload";

const liveReloadServer = createServer();
liveReloadServer.watch("./app/");
liveReloadServer.watch("./public/");
app.use(connectLiveReload());

//mysql -u root -p
const connection = await createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "the_prime_cut",
});

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
    const [reservations] = await connection.execute(
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
    const { name, email, date, time, table } = request.body;
    await connection.beginTransaction();

    //FIXME
    const [guestInsertResult] = await connection.execute(`
      INSERT INTO guests (first_name, email)
      SELECT '${name}', '${email}'
      WHERE NOT EXISTS (
        SELECT 1 
        FROM guests 
        WHERE first_name = '${name}'
          AND email = '${email}');
    `);
    console.log(guestInsertResult);
    const [reservationInsertResult] = await connection.execute(`
      INSERT INTO reservations (guest_id, table_number, date, hour)
      VALUES (${guestInsertResult.insertId}, ${table}, '${date}', ${time});
    `);
    console.log(reservationInsertResult);

    await connection.commit();
    response.status(200).send("Successfully updated reservations.");
  } catch (error) {
    await connection.rollback();
    console.error("Error updating reservations, transaction rolled back.", error);
    response.status(500).send("Error updating reservations, transaction rolled back.", error);
  }
});

// for resoure not found (404)
app.use((request, response, next) => {
  response.status(404).send(readFileSync("./app/html/404.html", "utf8"));
});

app.listen(PORT, () => {
  console.log(`The Prime Cut is listening on ${PORT}!`);
});
