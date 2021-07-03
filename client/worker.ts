import { Operation, OperationType } from "../types/types";

const ctx: Worker = self as any;

ctx.addEventListener("message", (e) => {
  const { data }: { data: Operation[] } = e;
  console.log("worker: Message received from main script");
  console.log("worker: operations", data);
  const operations: Operation[] = [];
  data.forEach((op, index, arr) => {
    const nextOp = arr[index + 1];
    if (
      // skip if next operation updating the same block text
      nextOp &&
      op.type === OperationType.UPDATE_TEXT &&
      nextOp.type === OperationType.UPDATE_TEXT &&
      op.blockId === nextOp.blockId
    ) {
      console.log("dismissing obsolete UPDATE_TEXT operation");
    } else {
      operations.push(op);
    }
  });

  console.log("worker: posting ", operations);
  fetch("/operations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(operations),
  }).then((res) => {
    if (res.status === 200) {
      // console.log(res);
      ctx.postMessage({ status: res.status });
    }
  });
  // console.log("worker: Posting message back to main script");
  // postMessage(workerResult);
});
