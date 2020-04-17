'use strict';

import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import KeywordListView from './KeywordListView';

const constants = require('../../common/constants');
const AttachmentUtil = require('../../common/AttachmentUtil').default;

class ArticlePreviewer extends React.Component {

  render() {
    const widgetRef = this;
    const {View, data, rootElementSize, ...other} = widgetRef.props;
    let contentWrapper = null;
    if (null == data) {
      return (
        <View>
        </View>
      );
    }

    const keywordWrapper = (
    <KeywordListView
                     style={ {
                               display: 'block',
                               width: '95%',
                               overflow: 'hidden',
                               whiteSpace: 'nowrap',
                               verticalAlign: 'middle',
                               textAlign: 'left',
                             } }
                     keywordList={ data.keywordList }
                     shouldDisable={ () => {
                                       return true;
                                     } }
                     maxCount={ constants.ARTICLE.CREATION_LIMIT.N_KEYWORDS }
                     cachedNewKeyword={ "" }
                     onSingleKeywordDeleteTriggeredBridge={ () => {} }
                     onNewKeywordAddTriggeredBridge={ () => {} }
                     onTextChangedBridge={ () => {} }
                     {...widgetRef.props} />
    );

    const shuffledDict = AttachmentUtil.instance.shuffleAttachments(data.attachmentList);
    let videoList = shuffledDict.videoList;
    let previewableVideoList = [];
    if (null != videoList) {
      videoList.map(function(single) {
        const effectiveVideoSrc = (single.downloadEndpoint + "/" + single.ossFilepath);
        previewableVideoList.push({
          src: effectiveVideoSrc,
        });
      });
    }

    let imageList = shuffledDict.imageList;
    let previewableImageList = [];
    if (null != imageList) {
      imageList.map(function(single) {
        const effectiveImgSrc = (single.downloadEndpoint + "/" + single.ossFilepath);
        previewableImageList.push({
          src: effectiveImgSrc,
        });
      });
    }

    let titleWrapper = null;
    if (undefined !== data.title && null !== data.title) {
      titleWrapper = (
        <View style={ {
                width: '100%',
                fontSize: 23,
                paddingTop: 10,
                fontWeight: 'bold',
                textAlign: 'center'
              } }>
          { data.title }
        </View>
      );
    }

    if (null != data.content) {
      contentWrapper = (
        <MarkdownRenderer
                          previewableVideoList={ previewableVideoList }
                          previewableImageList={ previewableImageList }
                          source={ data.content } />
      );
    }

    return (
      <View style={ widgetRef.props.styles }>
        { titleWrapper }
        { keywordWrapper }
        { contentWrapper }
      </View>
    );
  }
}

export default ArticlePreviewer;
