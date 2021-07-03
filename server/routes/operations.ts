import { pool } from "../../db";
import { Operation, OperationType } from "../../types/types";

async function operations(req, res) {
  // console.log(req.body);
  const operations: Operation[] = req.body;
  (async function () {
    // note: we don't try/catch this because if connecting throws an exception
    // we don't need to dispose of the client (it will be undefined)
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      operations.forEach((op) => {
        const { blockId, value, type } = op;
        if (!blockId || typeof blockId !== "string") {
          throw new Error("Error constructing query");
        }

        switch (type) {
          case OperationType.UPDATE_TEXT:
            const query = `UPDATE blocks SET text = $1 WHERE id = $2`;
            client.query(query, [value, blockId]);
            break;

          case OperationType.ADD_CHILD:
            const addChildQuery = `UPDATE blocks SET children = array_append(children, $1) WHERE id = $2`;
            client.query(addChildQuery, [value, blockId]);
            break;

          case OperationType.CREATE_BLOCK:
            const createBlockQuery = `INSERT INTO blocks (id, text) VALUES ($1, $2)`;
            client.query(createBlockQuery, [blockId, value]);
            break;

          case OperationType.REMOVE_CHILD:
            const removeChildQuery = `UPDATE blocks SET children = array_remove(children, $1) WHERE id = $2`;
            client.query(removeChildQuery, [value, blockId]);
            break;

          case OperationType.DELETE_BLOCK:
            const deleteBlockQuery = `DELETE FROM blocks WHERE id = $1`;
            client.query(deleteBlockQuery, [blockId]);
            break;
        }
      });

      await client.query("COMMIT");
      console.log("Transaction success!!");
      res.status(200).json({
        message: "success",
      });
    } catch (e) {
      console.error("caught an error in /operations ");
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  })().catch((error) => {
    console.error(error);
  });
  // if (!blockId || typeof blockId !== "string") {
  //   res.status(400).json({
  //     message: "Invalid block id",
  //   });
  // }
  // if (typeof value !== "string") {
  //   res.status(400).json({
  //     message: "Invalid value",
  //   });
  // }

  // const result = await db.query(query, params);
  // if (result.rowCount === 1) {
  //   res.status(200).send();
  // } else {
  //   res.status(500).json({
  //     message: "Something went wrong",
  //   });
  // }
}

export default operations;
