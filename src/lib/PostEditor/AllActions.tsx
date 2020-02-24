import {
  deletePosition,
  insertTextNode,
  deleteBlock,
  deleteNode,
  updateBlockFrame,
  updateNodeTransform,
  handleStopMovingNode,
  onChangeBlockText,
  action
} from "./actions";
import {
  updateTextAlign,
  updateBlockColor,
  updateTemplate,
  updateBorderType
} from "./TextPostBlock/textActions";
import { PostSchema } from "./EVENT_TYPES";

export const Actions = {
  deletePosition: action(PostSchema.Action.deletePosition, deletePosition),
  insertTextNode: action(PostSchema.Action.insertTextNode, insertTextNode),
  deleteBlock: action(PostSchema.Action.deleteBlock, deleteBlock),
  deleteNode: action(PostSchema.Action.deleteNode, deleteNode),
  updateBlockFrame: action(
    PostSchema.Action.updateBlockFrame,
    updateBlockFrame
  ),
  updateNodeTransform: action(
    PostSchema.Action.updateNodeTransform,
    updateNodeTransform
  ),
  handleStopMovingNode: action(
    PostSchema.Action.handleStopMovingNode,
    handleStopMovingNode
  ),
  onChangeBlockText: action(
    PostSchema.Action.onChangeBlockText,
    onChangeBlockText
  ),
  updateTextAlign: action(PostSchema.Action.updateTextAlign, updateTextAlign),
  updateBlockColor: action(
    PostSchema.Action.updateBlockColor,
    updateBlockColor
  ),
  updateTemplate: action(PostSchema.Action.updateTemplate, updateTemplate),
  updateBorderType: action(PostSchema.Action.updateBorderType, updateBorderType)
};

export default Actions;
