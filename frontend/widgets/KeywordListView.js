'use-strict';

import React from 'react';
import { KeywordListView as KeywordListViewWidget, } from 'crimson-react-widgets';

const constants = require('../../common/constants');
const LocaleManager = require('../../common/LocaleManager').default;

class KeywordListView extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    const widgetRef = this;
    const {View, Input, Button, shouldDisable, keywordList, maxCount, cachedNewKeyword, onTextChangedBridge, onSingleKeywordDeleteTriggeredBridge, onNewKeywordAddTriggeredBridge, onRegexViolationBridge, ...other} = widgetRef.props;

    let effectiveOnRegexViolationBridge = onRegexViolationBridge;
    if (undefined === effectiveOnRegexViolationBridge) {
      effectiveOnRegexViolationBridge = () => {
        // TODO
      };
    }
    const subProps = {
      View: View,
      Input: Input,
      Button: Button,

      deleteButtonSymbol: LocaleManager.instance.effectivePack().SYMBOL_CROSS,
      terminationHint: LocaleManager.instance.effectivePack().PLEASE_INPUT_KEYWORD,
      backgroundColor: constants.THEME.MAIN.KEYWORD_BG,
      fontColor: constants.THEME.MAIN.KEYWORD,
      regexForEach: constants.REGEX.KEYWORD,
      keywordList: keywordList,
      shouldDisable: shouldDisable,
      maxCount: maxCount,
      cachedNewKeyword: cachedNewKeyword,
      onRegexViolationBridge: effectiveOnRegexViolationBridge,
      onSingleKeywordDeleteTriggeredBridge: onSingleKeywordDeleteTriggeredBridge,
      onNewKeywordAddTriggeredBridge: onNewKeywordAddTriggeredBridge,
      onTextChangedBridge: onTextChangedBridge,
    };

    return (
      <KeywordListViewWidget {...subProps} />
    );
  }
}

export default KeywordListView;
