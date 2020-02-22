import {
  NewPostType,
  PostBlockType,
  BlockPositionList,
  PostLayout
} from "../enums";
import {
  EditableNodeMap,
  EditableNode
} from "../../components/NewPost/Node/BaseNode";

export namespace PostSchema {
  export enum Action {
    insertTextNode = "insertText",
    insertPhotoNode = "insertPhoto",

    updateBlockFrame = "updateBlockFrame",
    updateNodeFrame = "updateNodeFrame",

    deleteNode = "deleteNode",
    deleteBlock = "deleteBlock",
    editBlockImage = "editBlockImage",
    editNodeImage = "editNodeImage",
    transformNode = "transformNode",

    editTextBlockOverrides = "editTextBlockOverrides",
    editTextBlockValue = "editTextBlockValue",
    editTextBlockBorderType = "editTextBlockBorderType"
  }
}

export type PostEditorSchema = {
  post: NewPostType;
  inlineNodes: EditableNodeMap;
};

export type PostSchemaValue = PostEditorSchema;
