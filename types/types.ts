export enum OperationType {
  ADD_CHILD = "ADD_CHILD",
  CREATE_BLOCK = "CREATE_BLOCK",
  DELETE_BLOCK = "DELETE_BLOCK",
  REMOVE_CHILD = "REMOVE_CHILD",
  UPDATE_TEXT = "UPDATE_TEXT",
}

export interface Block {
  id: string;
  text: string;
  children?: string[];
}

export interface Operation {
  type: OperationType;
  blockId: string;
  value: string;
}
