'use strict';

import React, { Component } from 'react';

import createReactClass from 'create-react-class';

import { View, Topbar, Image, Video, Text, Input, NavItem, DropdownPicker, PickerItem, Button, pushNewScene, replaceNewScene, changeSceneTitle, HyperLink, goBack, topbarHeightPx, ModalPopup, queryNamedGatewayInfoDictSync, } from '../../../widgets/WebCommonRouteProps';

const LocaleManager = require('../../../../common/LocaleManager').default;
const NetworkFunc = require('../../../../common/NetworkFunc').default;
const Time = require('../../../../common/Time').default;
const constants = require('../../../../common/constants');

const WebFunc = require('../../../utils/WebFunc').default;

class Edit extends Component {
  constructor(props) {
    super(props);
    const sceneRef = this;

    this._initialized = false;

    this.styles = {
    };

    this.state = {
      disabled: true,

    };
  }


  componentDidMount() {
    const sceneRef = this;
    const query = NetworkFunc.searchStrToMap(sceneRef.props.location.search);
    const orgId = query.orgId;
    const isNew = (null == orgId);
    if (isNew) {
      changeSceneTitle(sceneRef, LocaleManager.instance.effectivePack().ADD_ORG);
    } else {
      changeSceneTitle(sceneRef, LocaleManager.instance.effectivePack().EDIT_ORG);
    }
  }

  componentDidUpdate(prevProps) {
    const sceneRef = this;
    if (sceneRef.props.location !== prevProps.location) {
      sceneRef.initScene();
    }
  }

  save() {
    const sceneRef = this;
    const params = sceneRef.props.match.params;
    const {location, basename, ...other} = sceneRef.props;
    const query = NetworkFunc.searchStrToMap(sceneRef.props.location.search);
    const orgId = query.orgId;
    const isNewOrg = (null == orgId);

    const bundleList = sceneRef.state.bundleListManager.bundleList;
    let ossFilepathList = [];
    if (null != sceneRef.state.cachedVideoOssFilepath) {
      ossFilepathList.push(sceneRef.state.cachedVideoOssFilepath);
    }

    for (let k in sceneRef.state.cachedImageOssFilepathDict) {
      ossFilepathList.push(sceneRef.state.cachedImageOssFilepathDict[k]);
    }

    const cookieToken = WebFunc.getCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);

    let paramDict = {
      title: sceneRef.state.cachedTitle,
      category: sceneRef.state.cachedCategory,
      content: sceneRef.state.cachedContent,
      ossFilepathList: JSON.stringify(ossFilepathList),
      keywordList: JSON.stringify(sceneRef.state.cachedKeywordList),
      token: cookieToken,
    };
    let url = null;
    if (isNewOrg) {
      url = basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.SAVE;
    } else {
      Object.assign(paramsDict, {
        orgId: orgId,
      });
      url = basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.SAVE;
    }
    NetworkFunc.post(url, paramDict)
      .then(function(response) {
        return response.json();
      })
      .then(function(responseData) {
        if (constants.RET_CODE.OK != responseData.ret) {
          console.log("Org not saved.");
          sceneRef.setState({
            disabled: false,
            savable: true,
            submittable: false,
          });
          return;
        }

        const orgIdStr = responseData.org.id;
        const pathname = constants.ROUTE_PATHS.ARTICLE + "/" + orgIdStr + constants.ROUTE_PATHS.EDIT;
        sceneRef._initialized = false;
        replaceNewScene(sceneRef, pathname);
      });
  }

  submit() {
    const sceneRef = this;
    const {location, basename, ...other} = sceneRef.props;
    const params = sceneRef.props.match.params;
    const query = NetworkFunc.searchStrToMap(sceneRef.props.location.search);
    const orgId = query.orgId;
    sceneRef.setState({
      disabled: true,
      submittable: false,
    }, function() {
      const url = basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.SUBMIT;
      const cookieToken = WebFunc.getCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);

      const paramDict = {
        token: cookieToken,
        orgId: orgId,
      };
      NetworkFunc.post(url, paramDict)
        .then(function(response) {
          return response.json();
        })
        .then(function(responseData) {
          if (constants.RET_CODE.OK != responseData.ret) {
            console.log("Org not submitted.");
            alert(LocaleManager.instance.effectivePack().OOPS);
            sceneRef.setState({
              disabled: false,
            });
            return;
          }
          goBack(sceneRef);
        });
    });
  }

  initScene() {
    if (this._initialized) return;
    this._initialized = true;

    const sceneRef = this;
    const {location, basename, ...other} = sceneRef.props;
    const query = NetworkFunc.searchStrToMap(sceneRef.props.location.search);
    const orgId = query.orgId;

    const cookieToken = WebFunc.getCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);
    const paramDict = {
      token: cookieToken,
      orgId: orgId,
    };
    const url = basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.DETAIL;
    let cachedOrg = null;
    NetworkFunc.get(url, paramDict)
      .then(function(response) {
        return response.json();
      })
      .then(function(responseData) {
        if (constants.RET_CODE.OK != responseData.ret) {
          sceneRef.props.RoleLoginSingleton.instance.checkWhetherTokenHasExpiredAsync(sceneRef, responseData)
            .then(function(trueOrFalse) {
              if (false == trueOrFalse) {
                return;
              }
              sceneRef.props.RoleLoginSingleton.instance.replaceRoleLoginScene(sceneRef);
            });
          return;
        }
        cachedOrg = responseData.org;
        return sceneRef.refreshView(cachedOrg);
      });
  }

  refreshView(cachedOrg) {
    const sceneRef = this;
  }

  onSingleImageUploadError(index) {
    console.log('onSingleImageUploadError ' + index);
    const sceneRef = this;
    const newBundleListManager = sceneRef.state.bundleListManager;
    newBundleListManager.assignAtIndex(index, {
      progressPercentage: 0.0,
      uploaderState: SINGLE_UPLOADER_STATE.LOCALLY_PREVIEWING,
    });

    --sceneRef._toUploadCount;
    if (0 != sceneRef._toUploadCount) {
      sceneRef.setState({
        bundleListManager: newBundleListManager,
      });
      return;
    }

    const imageBatchUploaderState = sceneRef._multiSelectorRef.getBatchUploaderStateSync();
    if ((BATCH_UPLOADER_STATE.SOME_UPLOADING & imageBatchUploaderState) > 0) {
      sceneRef.setState({
        bundleListManager: newBundleListManager,
      });
    } else if ((BATCH_UPLOADER_STATE.SOME_LOCALLY_PREVIEWING & imageBatchUploaderState) > 0) {
      sceneRef.setState({
        disabled: false,
        bundleListManager: newBundleListManager,
      });
    } else ;
  }

  onSingleImageUploaded(index) {
    console.log('onSingleImageUploaded ' + index);
    const sceneRef = this;
    const {location, ...other} = sceneRef.props;
    const newBundleListManager = sceneRef.state.bundleListManager;
    const newImageOssFilepathDict = sceneRef.state.cachedImageOssFilepathDict;

    newBundleListManager.assignAtIndex(index, {
      progressPercentage: 100.0,
      uploaderState: SINGLE_UPLOADER_STATE.UPLOADED,
    });
    const bundle = newBundleListManager.bundleList[index];
    newImageOssFilepathDict[index] = bundle.extUploader.getOption(constants.KEY);

    --sceneRef._toUploadCount;
    if (0 != sceneRef._toUploadCount) {
      sceneRef.setState({
        bundleListManager: newBundleListManager,
        cachedImageOssFilepathDict: newImageOssFilepathDict,
      });
      return;
    }

    sceneRef.saveIfAllUploaded(sceneRef.state.videoBundle, sceneRef.state.cachedVideoOssFilepath, newBundleListManager, newImageOssFilepathDict);
  }

  onVideoUploadError() {
    const sceneRef = this;
    const newVideoBundle = sceneRef.state.videoBundle;
    newVideoBundle.assign({
      progressPercentage: 0.0,
      uploaderState: SINGLE_UPLOADER_STATE.LOCALLY_PREVIEWING,
    });

    --sceneRef._toUploadCount;
    if (0 != sceneRef._toUploadCount) {
      sceneRef.setState({
        videoBundle: newVideoBundle,
      });
      return;
    }

    sceneRef.setState({
      disabled: false,
      videoBundle: newVideoBundle,
    });
  }

  render() {
    const sceneRef = this;
    const {location, basename, ...other} = sceneRef.props;
    const params = sceneRef.props.match.params;
    const styles = sceneRef.styles;
    const query = NetworkFunc.searchStrToMap(sceneRef.props.location.search);
    const orgId = query.orgId;

    const isNewOrg = (null == orgId);

    const currentMomentObj = Time.currentMomentObj();

    const menuProps = Object.assign({
      showLoginNav: false,
      ref: (c) => {
        if (!c) return;
      },
      onHasLoggedIn: () => {
        const boundInitScene = sceneRef.initScene.bind(sceneRef);
        boundInitScene();
      },
      onHasNotLoggedIn: () => {
        sceneRef.props.RoleLoginSingleton.instance.replaceRoleLoginScene(sceneRef);
      },
      sceneRef: sceneRef,
    }, sceneRef.props);

    const topbarChildren = [orgStateToDisplay];
    const topbar = (
    <Topbar
            style={ {
                      paddingTop: 10
                    } }
            {...menuProps}>
      { topbarChildren }
    </Topbar>
    );

    // Category picker building.
    let categoryPickerItemList = [];
    categoryChoiceList.map(function(single) {
      const singleCell = (
      <PickerItem
                  disabled={ sceneRef.state.disabled }
                  key={ single.title }
                  onClick={ (evt) => {
                              sceneRef.setState({
                                cachedCategory: single.key,
                              });
                            } }>
        { single.title }
      </PickerItem>
      );
      categoryPickerItemList.push(singleCell);
    });

    let effectiveCategoryTitle = null;
    for (let i = 0; i < categoryChoiceList.length; ++i) {
      if (categoryChoiceList[i].key != sceneRef.state.cachedCategory) continue;
      effectiveCategoryTitle = categoryChoiceList[i].title;
      break;
    }

    const namedGatewayInfo = queryNamedGatewayInfoDictSync().articleServer;

    return (
      <View style={ {
                display: 'block',
                paddingLeft: 5,
                paddingRight: 5,
              } }>
        { topbar }
      </View>
    );
  }
}

export default Edit;
