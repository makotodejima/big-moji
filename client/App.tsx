import figlet from "figlet";
import ghost from "figlet/importable-fonts/Ghost.js";
import speed from "figlet/importable-fonts/Speed.js";
import standard from "figlet/importable-fonts/Standard.js";
import debounce from "lodash/debounce";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import styled, { css } from "styled-components";
import { v4 as uuid } from "uuid";
import { Block, Operation, OperationType } from "../types/types";
import useSessionStorage from "../utils/useSessionStorage";

function runWorker(operations: Operation[]) {
  const worker = new Worker("./worker.ts");
  worker.postMessage(operations);
  console.log("Operations sent to worker");
  worker.onerror = (e) => {
    console.error(e);
  };
  worker.onmessage = (e) => {
    if (e.data.status === 200) {
      console.log("Worker job succeeded");
      worker.terminate();
    } else {
      console.error(e);
    }
  };
}

const processOperations = debounce(function (
  operations: Operation[],
  cb: () => void,
) {
  runWorker(operations);
  cb();
},
1000);

const App = () => {
  let socket: Socket;
  function testEvent() {
    socket.emit("new message", { test: "broadcast", value: 0 });
  }

  const [root, setRoot] = useSessionStorage<Block | null>("test-note-id");
  const [loading, setLoading] = useState(true);
  const operationsRef = useRef<Operation[]>([]);

  // useEffect(() => {
  //   socket = io("http://localhost:3000");
  //   socket.on("broadcast", (message) => {
  //     console.log("received broadcast: ", message);
  //   });
  //   figlet.parseFont("Standard", standard);

  //   return () => {
  //     socket.disconnect();
  //   };
  // }, []);
  //

  useEffect(() => {
    // Load fonts for feglet
    figlet.parseFont("Standard", standard);
    figlet.parseFont("Ghost", ghost);
    figlet.parseFont("Speed", speed);

    // Initial data load
    fetch("/blocks").then((res) =>
      res
        .json()
        .then((data: { rows: Block[] }) => {
          let root: Block | null = null;
          data.rows.forEach((block) => {
            sessionStorage.setItem(block.id, JSON.stringify(block));
            if (block.id === "test-note-id") {
              root = block;
            }
          });
          if (root === null) {
            throw new Error(`Root block not found`);
          }
          return root;
        })
        .then((root: Block) => {
          if (!root.children?.length) {
            const newBlockId = uuid();
            const operations = [
              {
                type: OperationType.ADD_CHILD,
                blockId: root.id,
                value: newBlockId,
              },
              {
                type: OperationType.CREATE_BLOCK,
                blockId: newBlockId,
                value: "",
              },
            ];
            fetch("/operations", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(operations),
            }).then((res) => {});
            return {
              id: root.id,
              text: "",
              children: [newBlockId],
            };
          } else {
            return root;
          }
        })
        .then((root) => {
          setRoot(root);
          setLoading(false);
        }),
    );
  }, []);

  if (loading) {
    return <code>LOADING</code>;
  }

  if (!root?.children?.length) {
    return <code>No children </code>;
  }

  return (
    <>
      {root.children.map((blockId) => {
        return (
          <Item
            key={blockId}
            blockId={blockId}
            operationsRef={operationsRef}
            root={root}
            setRoot={setRoot}
          />
        );
      })}
    </>
  );
};

export default App;

const Item = ({ blockId, operationsRef, root, setRoot }) => {
  const [block, setBlock] = useSessionStorage<Block | null>(blockId, null);
  console.log("ops", operationsRef.current);
  if (block === null) {
    throw new Error("Block not found for id: " + blockId);
  }
  return (
    <PreWrapper key={block.id}>
      <Input
        autoFocus
        value={block.text}
        onChange={(e) => {
          setBlock({ ...block, text: e.target.value });
          const operation: Operation = {
            type: OperationType.UPDATE_TEXT,
            blockId: block.id,
            value: e.target.value,
          };
          operationsRef.current.push(operation);
          processOperations(operationsRef.current, () => {
            operationsRef.current = [];
          });
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const newBlockId = uuid();
            const operations: Operation[] = [
              {
                type: OperationType.ADD_CHILD,
                blockId: root.id,
                value: newBlockId,
              },
              {
                type: OperationType.CREATE_BLOCK,
                blockId: newBlockId,
                value: "",
              },
            ];
            operationsRef.current.push(...operations);
            processOperations(operationsRef.current, () => {
              operationsRef.current = [];
            });

            sessionStorage.setItem(
              newBlockId,
              JSON.stringify({ id: newBlockId, text: "" }),
            );
            setRoot((prev: Block) => ({
              ...prev,
              children: [...(prev.children ? prev.children : []), newBlockId],
            }));
          }

          if (e.key === "Backspace" && block.text === "") {
            console.log("delete");
            const operations: Operation[] = [
              {
                type: OperationType.DELETE_BLOCK,
                blockId: block.id,
                value: "",
              },
              {
                type: OperationType.REMOVE_CHILD,
                blockId: root.id,
                value: block.id,
              },
            ];
            operationsRef.current.push(...operations);
            processOperations(operationsRef.current, () => {
              operationsRef.current = [];
            });

            sessionStorage.removeItem(blockId);
            setRoot((prev: Block) => ({
              ...prev,
              children: [
                ...(prev.children
                  ? prev.children.filter((childId) => childId !== blockId)
                  : []),
              ],
            }));
          }
        }}
      />
      <Pre>
        {figlet.textSync(block.text, "Standard")}
        {/* <Caret /> */}
      </Pre>
    </PreWrapper>
  );
};

const Input = styled.input`
  position: absolute;
  height: 110px;
  width: 100%;
  padding: 0;
  border: transparent;
  outline: transparent;
  color: transparent;
  background: transparent;
`;

const Pre = styled.pre``;

const caret = css`
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 110px;
  background: lightgrey;
`;

const Caret = styled.span`
  ${caret};
`;

const PreWrapper = styled.div`
  position: relative;
  &:focus-within {
    ${Caret} {
      background: black;
    }
  }
`;
