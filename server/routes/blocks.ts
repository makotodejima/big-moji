import db from "../../db";
async function blocks(req, res) {
  const result = await db.query("SELECT * from blocks", []);
  res.send(result);
}

export default blocks;
