import db from "../../db";
async function testRoute(req, res) {
  const result = await db.query("SELECT title from test", []);
  console.log(result);
  res.send(result);
}

export default testRoute;
