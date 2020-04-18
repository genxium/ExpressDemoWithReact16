'use-strict';

import React from 'react';
import ClipartClose from './ClipartClose';
import MarkdownRenderer from './MarkdownRenderer';

import { View, ModalPopup, } from './WebCommonRouteProps';

const constants = require('../../common/constants');

class WholeArticlePreviewer extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const widgetRef = this;
    let {source, previewableVideoList, previewableImageList, onHide, shouldDisable, shouldShow, ...other} = widgetRef.props;

    const closeButton = (
    <View
          disabled={ shouldDisable() }
          style={ {
                    position: "absolute",
                    left: 5,
                    backgroundColor: constants.THEME.MAIN.TRANSPARENT,
                  } }
          onClick={ (evt) => {
                      onHide();
                    } }>
      <ClipartClose />
    </View>
    );

    const buttonListRow = (
    <View style={ {
                position: "relative",
                height: 57,
                backgroundColor: constants.THEME.MAIN.BLACK,
              } }>
      { closeButton }
    </View>
    );

    if (null != previewableVideoList && 0 < previewableVideoList.length) {
      // Hardcoded temporarily. -- YFLu, 2020-04-14
      source = "!{" + constants.YAMD.TAG.VIDEO + "}%0%\n" + source;
    }

    return (
      <ModalPopup
                  style={ {
                            overlay: {
                              position: 'fixed',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              overflowWrap: 'break-word',
                              overflowX: 'auto',
                              overflowY: 'scroll',
                              backgroundColor: constants.THEME.MAIN.WHITE,
                              zIndex: 1,
                            },
                            content: {
                              position: 'absolute',
                              top: 0,
                              left: '0px',
                              right: '0px',
                              bottom: 'auto',
                              border: 'none',
                              borderRadius: '0px',
                              overflow: 'hidden',
                              background: constants.THEME.MAIN.WHITE,
                              padding: '0px',
                              backgroundColor: constants.THEME.MAIN.WHITE,
                            }
                          } }
                  show={ shouldShow() }>
        { buttonListRow }
        <MarkdownRenderer
                          videoTag={ constants.YAMD.TAG.VIDEO }
                          imgTag={ constants.YAMD.TAG.IMAGE }
                          ktxTag={ constants.YAMD.TAG.KATEX }
                          mermaidTag={ constants.YAMD.TAG.MERMAID }
                          alignCenterTag={ constants.YAMD.TAG.ALIGN_CENTER }
                          previewableVideoList={ previewableVideoList }
                          previewableImageList={ previewableImageList }
                          source={ source } />
      </ModalPopup>
    );
  }
}

export default WholeArticlePreviewer;
