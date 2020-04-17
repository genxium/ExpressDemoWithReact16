import React from 'react';

import ShortcutIconStrikeOut from './ClipartStrikeout';
import ShortcutIconCode from './ClipartCode';
import ShortcutIconQuote from './ClipartQuote';
import ShortcutIconStateMachine from './ClipartStateMachine';
import ShortcutIconSequenceDiagram from './ClipartSequenceDiagram';
import ShortcutIconFormula from './ClipartFormula';

import { YAMDEditor } from 'crimson-react-widgets';

const LocaleManager = require('../../common/LocaleManager').default;
const constants = require('../../common/constants');

class MarkdownEditor extends React.Component {
  constructor(props) {
    super(props);
    this._editorRef = null;
  }

  insertImageAtCursor(imageIdx) {
    const widgetRef = this;
    if (!widgetRef._editorRef) return;
    widgetRef._editorRef.insertImageAtCursor(imageIdx);
  }

  render() {
    const widgetRef = this;
    const {shouldDisable, style, text, shouldHideShortcutBar, previewableImageList, previewableVideoList, SinglePicker, SinglePickerItem, onTextChangedBridge, ...other} = widgetRef.props;
    const sharedIconStyle = {
      marginLeft: 2,
      marginRight: 2,
      marginTop: 2,
      backgroundColor: constants.THEME.MAIN.WHITE,
      color: constants.THEME.MAIN.GREY,
      fontWeight: 'bold',
    };

    const editorProps = {
      style: style,
      previewableVideoPickerTitle: 'vid',
      previewableImagePickerTitle: 'pic',
      sharedIconStyle: sharedIconStyle,
      strikeOutIcon: (<ShortcutIconStrikeOut />),
      fenceIcon: (<ShortcutIconCode />),
      indentationIcon: (<ShortcutIconQuote />),
      hyperlinkIcon: 'href',
      listIcon: 'ul',
      veGraphIcon: (<ShortcutIconStateMachine />),
      seqDiagramIcon: (<ShortcutIconSequenceDiagram />),
      mathIcon: (<ShortcutIconFormula />),
      highlightIcon: 'hl',
      boldIcon: 'bold',
      italicIcon: 'I',
      alignCenterIcon: '≡',

      content: text,
      onContentChangedBridge: onTextChangedBridge,
      shouldDisable: shouldDisable,

      videoTag: constants.YAMD.TAG.VIDEO,
      imgTag: constants.YAMD.TAG.IMAGE,
      ktxTag: constants.YAMD.TAG.KATEX,
      mermaidTag: constants.YAMD.TAG.MERMAID,
      alignCenterTag: constants.YAMD.TAG.ALIGN_CENTER,

      previewableImageList: previewableImageList,
      previewableVideoList: previewableVideoList,

      shouldHideShortcutBar: shouldHideShortcutBar,

      SinglePicker: SinglePicker,
      SinglePickerItem: SinglePickerItem,

      ref: function(c) {
        if (!c) return;
        widgetRef._editorRef = c;
      },
    };

    return (
      <YAMDEditor {...editorProps} />
    );
  }
}

export default MarkdownEditor;
