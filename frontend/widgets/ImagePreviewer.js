'use-strict';

import React from 'react';
import ClipartClose from './ClipartClose';
import ClipartDelete from './ClipartDelete';

const constants = require('../../common/constants');

class ImagePreviewer extends React.Component {
  constructor(props) {
    super(props);
    this.styles = {
      buttonListRow: {
        position: "relative",
        height: 32,
        padding: 5,
        marginBottom: 5,
      }
    }
  }

  render() {
    const widgetRef = this;
    const {Button, ModalPopup, Text, View, Image, onDeleteImageAtActiveIndexBridge, cachedImageList, activeIndex, onHide, shouldDisable, shouldShow, hasDeleteButton, ...other} = widgetRef.props;
    const styles = widgetRef.styles;

    const shouldHideDeleteButton = (null != hasDeleteButton && true == hasDeleteButton);
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
    const deleteButton = (
    <View
          style={ {
                    display: (shouldHideDeleteButton ? 'none' : 'inherit'),
                    position: "absolute",
                    right: 5,
                    backgroundColor: constants.THEME.MAIN.TRANSPARENT,
                  } }
          disabled={ shouldDisable() }
          onClick={ (evt) => {
                      onDeleteImageAtActiveIndexBridge();
                    } }>
      <ClipartDelete />
    </View>
    );
    const buttonListRow = (
    <View style={ styles.buttonListRow }>
      { closeButton }
      { deleteButton }
    </View>
    );

    // TODO: The previewer is temporarily only available for 1 image at a time.
    let imageNodeList = [];
    if (null != activeIndex()) {
      const singleImageData = cachedImageList[activeIndex()];
      const singleNode = (
      <View
            key={ activeIndex() }
            style={ {
                      display: 'block',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      height: 300,
                      maxHeight: 300,
                      marginLeft: "auto",
                      marginRight: "auto",
                    } }>
        <Image
               src={ singleImageData.src }
               style={ {
                         width: 'auto',
                         height: '100%',
                         objectFit: "contain",
                       } }>
        </Image>
      </View>
      );

      imageNodeList.push(singleNode);
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
                              backgroundColor: "black",
                              zIndex: 1,
                            },
                            content: {
                              position: 'absolute',
                              top: '100px',
                              left: '0px',
                              right: '0px',
                              bottom: 'auto',
                              border: 'none',
                              borderRadius: '0px',
                              background: '#fff',
                              overflow: 'inherit',
                              WebkitOverflowScrolling: 'touch',
                              outline: 'none',
                              padding: '0px',
                              backgroundColor: 'black'
                            }
                          } }
                  show={ shouldShow() }
                  onHide={ onHide }>
        <View>
          { imageNodeList }
        </View>
        { buttonListRow }
      </ModalPopup>
    );
  }
}

export default ImagePreviewer;
