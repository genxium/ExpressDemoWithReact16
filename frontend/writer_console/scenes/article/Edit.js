'use-strict';

import React, { Component } from 'react';

import ImagePreviewer from '../../../widgets/ImagePreviewer';

import MarkdownEditor from '../../../widgets/MarkdownEditor';
import MarkdownRenderer from '../../../widgets/MarkdownRenderer';
import ClipartAddImage from '../../../widgets/ClipartAddImage';

import {
  SINGLE_UPLOADER_STATE,
  BATCH_UPLOADER_STATE,
  SingleImageSelectorBundleListManager,
  StatelessMultiImageSelector,
} from 'crimson-react-widgets';

import KeywordListView from '../../../widgets/KeywordListView';
import createReactClass from 'create-react-class';

import {
  View, 
  Topbar, 
  Image,
  Text,
  Input,
  NavItem, 
  DropdownPicker, 
  PickerItem,
  Button, 
  pushNewScene,
  replaceNewScene,
  changeSceneTitle,
  HyperLink,
  goBack,
  topbarHeightPx,
  ModalPopup,
  queryNamedGatewayInfoDictSync,
} from '../../../widgets/WebCommonRouteProps';

const LocaleManager = require('../../../../common/LocaleManager').default;
const NetworkFunc = require('../../../../common/NetworkFunc').default;
const Time = require('../../../../common/Time').default;
const constants = require('../../../../common/constants');
const ArticleUtil = require('../../../../common/ArticleUtil').default;
const categoryChoiceList =  ArticleUtil.instance.categoryChoiceList();
const PlupLoad = require('plupload');

const WebFunc = require('../../../utils/WebFunc').default;

const ConfirmBox = createReactClass({
  getInitialState: function() {
    return {
      inputVal: "",
    };
  },
  render: function() {
    const widgetRef = this;
    const props = widgetRef.props;
    const title = props.title;
    const onConfirmedBridge = props.onConfirmedBridge;
    const show = props.show; 
    const onHide = props.onHide;
    const inputPlaceHolder = props.inputPlaceHolder;
    const inputRegex = props.inputRegex;

    const cancelBtnTxt = props.cancelBtnTxt;
    const confirmBtnTxt = props.confirmBtnTxt;

    const cancelBtn = React.createElement(Button, {
      onPress: function() {
        onHide();
      },
      style: {
        margin: 10
      },
    }, cancelBtnTxt); 

    const confirmBtn = React.createElement(Button, {
      onPress: function() {
        if (undefined !== inputRegex && null !== inputRegex && !inputRegex.test(widgetRef.state.inputVal)) return;
        onConfirmedBridge(widgetRef.state.inputVal);
      },
      style: {
        margin: 10
      },
    }, confirmBtnTxt); 

		const btnGroup = React.createElement(View, {
      style: {
        textAlign: 'center', 
        padding: 20
      }
    }, cancelBtn, confirmBtn); 

    const input = React.createElement(Input, {
      style: {
        width: '60%',
        marginLeft: 5,
      },
      value: widgetRef.state.inputVal,
      onUpdated: function(evt) {
        widgetRef.setState({
          inputVal: evt.target.value,
        }); 
      },
      placeholder: inputPlaceHolder,
    });

    return React.createElement(ModalPopup, {
      show: show,
      onHide: onHide,
      title: title,
    }, input, btnGroup);
	},
});

class Edit extends Component {
  constructor(props) {
    super(props);
    const sceneRef = this;

    this._initialized = false;
    this._multiSelectorRef = null;
    this._imagePreviewerRef = null;
    this._mdEditorRef = null;
    this._toUploadCount = null;

    this.styles = {
    };

    this.state = {
      disabled: true,
      savable: false,
      submittable: false,
      previewable: false,

      bundleListManager: new SingleImageSelectorBundleListManager(),
      cachedImageOssFilepathDict: {},

      showImagePreviewer: false,
      imagePreviewerActiveIndex: null,

      showSuspensionReasonBox: false,
      
      cachedTitle: '',
      cachedCategory: constants.ARTICLE.CATEGORY.LATEST,
      cachedContent: '',
      cachedArticle: null,

      cachedKeywordList: [],
      cachedNewKeyword: "",
    };
  }

  isContentValid(title, content) {
    // TODO: Specify actual conditions.
    return true;
  }

  componentDidMount() {
    const sceneRef = this;
    const params = sceneRef.props.match.params;  
    const isNew = (null == params || null == params.articleId);
    if (isNew) {
      changeSceneTitle(sceneRef, LocaleManager.instance.effectivePack().ADD_ARTICLE);
    } else {
      changeSceneTitle(sceneRef, LocaleManager.instance.effectivePack().EDIT_ARTICLE);
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
    const isNewArticle = (null == params.articleId);

    const bundleList = sceneRef.state.bundleListManager.bundleList;
    let ossFilepathList = [];
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
    if (isNewArticle) url = basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.SAVE; 
    else url = basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.ARTICLE + "/" + params.articleId + constants.ROUTE_PATHS.SAVE;
    NetworkFunc.post(url, paramDict)
    .then(function(response) {
      return response.json();
    })
    .then(function(responseData) {
      if (constants.RET_CODE.OK != responseData.ret) {
        console.log("Article not saved.");
        sceneRef.setState({
          disabled: false,
          savable: true,
          submittable: false,
        });
        return;
      }

      if (!isNewArticle) {
        const cachedArticle = responseData.article;
        sceneRef.refreshView(cachedArticle);
      } else {
        const articleIdStr = responseData.article.id;
        const pathname = constants.ROUTE_PATHS.ARTICLE + "/" + articleIdStr + constants.ROUTE_PATHS.EDIT;
        sceneRef._initialized = false;
        replaceNewScene(sceneRef, pathname);
      }
    });
  }

  submit() {
    const sceneRef = this;
    const {location, basename, ...other} = sceneRef.props;
    const params = sceneRef.props.match.params;
    sceneRef.setState({
      disabled: true,
      submittable: false,
    }, function() {
      const url = basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.ARTICLE + "/" + params.articleId + constants.ROUTE_PATHS.SUBMIT;
      const cookieToken = WebFunc.getCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);

      const paramDict = {
        token: cookieToken,
      };
      NetworkFunc.post(url, paramDict)
      .then(function(response) {
        return response.json();
      })
      .then(function(responseData) {
        if (constants.RET_CODE.OK != responseData.ret) {
          console.log("Article not submitted.");
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

  suspend(reason) {
    const sceneRef = this;
    const params = sceneRef.props.match.params;
    const {goBack, location, basename, ...other} = sceneRef.props;
    sceneRef.setState({
      disabled: true,
      submittable: false,
    }, function() {
      const url = basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.ARTICLE + "/" + params.articleId + constants.ROUTE_PATHS.SUSPEND;
      const cookieToken = WebFunc.getCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);
      const paramDict = {
        reason: reason,
        token: cookieToken,
      };
      NetworkFunc.post(url, paramDict)
      .then(function(response) {
        return response.json();
      })
      .then(function(responseData) {
        if (constants.RET_CODE.OK != responseData.ret) {
          console.log("Article not suspended.");
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
    const params = sceneRef.props.match.params;
    const {location, basename, ...other} = sceneRef.props;

    const isNewArticle = (null == params.articleId);

    if (true == isNewArticle) {
      let newBundleListManager = sceneRef.state.bundleListManager;
      newBundleListManager.pushNew();
      sceneRef.setState({
        bundleListManager: newBundleListManager,
      }, function() {
        sceneRef.setState({
          disabled: false,
        });
      });
      return;
    }

    const cookieToken = WebFunc.getCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);
    const paramDict = {
      token: cookieToken,
    };
    const url = basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.ARTICLE + "/" + params.articleId + constants.ROUTE_PATHS.DETAIL;
    let cachedArticle = null;
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
      cachedArticle = responseData.article;
      return sceneRef.refreshView(cachedArticle);
    });
  }

  refreshView(cachedArticle) {
    const sceneRef = this;
    // NOTE: The `translation` below is unnecessary, but for correctness ensurance it's still used.
    let newBundleListManager = new SingleImageSelectorBundleListManager();
    for (let i = 0; i < cachedArticle.imageList.length; ++i) {
      const singleRecord = cachedArticle.imageList[i];
      const uploader = new PlupLoad.Uploader({
        key: singleRecord.ossFilepath,
      });
      newBundleListManager.pushNew();
      newBundleListManager.resetAtIndex(i, {
        uploaderState: SINGLE_UPLOADER_STATE.UPLOADED,
        remoteName: singleRecord.ossFilepath,
        effectiveImgSrc: singleRecord.downloadEndpoint + '/' + singleRecord.ossFilepath,
        progressPercentage: 100.0,
        extUploader: uploader,
      });
    }

    // NOTE: Definitely all occupied.
    const isEditable = ArticleUtil.instance.isEditable(cachedArticle);
    if (isEditable && newBundleListManager.bundleList.length < constants.ATTACHMENT.IMAGE.POLICY.N_PER_ARTICLE) {
      newBundleListManager.pushNew();
    }

    const cachedKeywordList = (undefined === cachedArticle.keywordList || null === cachedArticle.keywordList ? [] : cachedArticle.keywordList);

    sceneRef.setState({
      savable: false,
      submittable: true,
      previewable: true,
      bundleListManager: newBundleListManager,
      cachedArticle: cachedArticle,
      cachedTitle: (undefined === cachedArticle.title ? "" : cachedArticle.title),
      cachedCategory: (undefined === cachedArticle.category ? constants.ARTICLE.CATEGORY.INFORMATION : parseInt(cachedArticle.category)),
      cachedContent: cachedArticle.content,
      cachedKeywordList: cachedKeywordList,
    }, function() {
      sceneRef.setState({
        disabled: (!isEditable),
      });
    });
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

    const validationResult = sceneRef._multiSelectorRef.getBatchUploaderStateSync();
    if ((BATCH_UPLOADER_STATE.SOME_UPLOADING & validationResult) > 0) {  
      sceneRef.setState({
        bundleListManager: newBundleListManager,
      });
    } else if ((BATCH_UPLOADER_STATE.SOME_LOCALLY_PREVIEWING & validationResult) > 0) {
      sceneRef.setState({
        disabled: false,
        bundleListManager: newBundleListManager,
      });
    } else;
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

    const validationResult = sceneRef._multiSelectorRef.getBatchUploaderStateSync();
 
    if ((BATCH_UPLOADER_STATE.SOME_CREATED & validationResult) > 0 || (BATCH_UPLOADER_STATE.SOME_UPLOADING & validationResult) > 0) {  
      sceneRef.setState({
        bundleListManager: newBundleListManager,
        cachedImageOssFilepathDict: newImageOssFilepathDict,
      });
    } else if ((BATCH_UPLOADER_STATE.SOME_LOCALLY_PREVIEWING & validationResult) > 0) {
      sceneRef.setState({
        disabled: false,
        bundleListManager: newBundleListManager,
        cachedImageOssFilepathDict: newImageOssFilepathDict,
      });
    } else {
      // SOME_INITIALIZED or ALL_UPLOADED.
      sceneRef.setState({
        bundleListManager: newBundleListManager,
        cachedImageOssFilepathDict: newImageOssFilepathDict,
      }, function() {
        sceneRef.save();
      });
    }
  }

  onTitleChanged(title) {
    const sceneRef = this;
    sceneRef.setState({
      cachedTitle: title,
      savable: sceneRef.isContentValid(sceneRef.state.cachedTitle, sceneRef.state.cachedContent),
      submittable: false,
      previewable: false,
    });
  }

  render() {
    const sceneRef = this;
    const {location, basename, ...other} = sceneRef.props;
    const params = sceneRef.props.match.params;
    const styles = sceneRef.styles;

    const isNewArticle = (null == params.articleId);
    const shouldWaitForCachedArticle = (!isNewArticle && null == sceneRef.state.cachedArticle);

    const currentMomentObj = Time.currentMomentObj();
    let articleId = params.articleId;

    const multiImageSelector = (
      <StatelessMultiImageSelector
      ref={ (c) => {
        if (!c) return;
        sceneRef._multiSelectorRef = c;
      }}
      View={View}
      Image={Image}
      style={{
        backgroundColor: constants.THEME.MAIN.WHITE,
        width: '100%',
        padding: 5,
      }}
      singleImageSelectorSize={{
        w: 163,                                   
        h: 154
      }}
      bundleListManager={sceneRef.state.bundleListManager}
      shouldDisable={ () => {
        return sceneRef.state.disabled;
      }}
      showFileRequirementHint={() => {
        alert(LocaleManager.instance.effectivePack().HINT.FOOD_PREVIEW_IMAGE_REQUIREMENT);
      }}
      singleFileSizeLimitBytes={constants.ATTACHMENT.IMAGE.POLICY.SINGLE_SIZE_LIMIT_BYTES}
      allowedMimeList={constants.ATTACHMENT.IMAGE.POLICY.ALLOWED_MIME_TYPES}
      uploadedMark={'✅'}
      progressBarColor={constants.THEME.MAIN.BLUE}
      BrowserButtonComponent={ClipartAddImage}
      queryAndSetSingleBundleExtUploaderCredentialsAsync={ (pluploadUploader) => {
        return new Promise(function(resolve, reject) {
          const cookieToken = WebFunc.getCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);
          const paramsDict = {
            token: cookieToken,
          };
          const url = basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.UPTOKEN + constants.ROUTE_PATHS.FETCH;
          NetworkFunc.get(url, paramsDict)
          .then(function(response) {
            return response.json();
          })
          .then(function(responseData) {
            console.log("Getting resp from ", url, " == ", responseData); 
            if (constants.RET_CODE.OK !== responseData.ret) {
              resolve(null);
            } else {
              pluploadUploader.setOption({
                url: responseData.uphost + '/',
                chunk_size: undefined,
                multipart: true,
                multipart_params: {
                  token: responseData.uptoken, 
                  key: responseData.ossFilepath, 
                },
                key: responseData.ossFilepath, // For later `getOption` shortcut usage. 
              });
              resolve(pluploadUploader);
            }
          });
        });
      }}
      onSingleLocalImageAddedBridge={ (idx, props) => {
        const newBundleListManager = sceneRef.state.bundleListManager;
        newBundleListManager.assignAtIndex(idx, props);
        
        const bundleList = newBundleListManager.bundleList; 
        if (newBundleListManager.allOccupied() && bundleList.length < constants.ATTACHMENT.IMAGE.POLICY.N_PER_ARTICLE) {
          newBundleListManager.pushNew();
        }
        sceneRef.setState({
          savable: sceneRef.isContentValid(sceneRef.state.cachedContent),
          submittable: false,
          bundleListManager: newBundleListManager,
        }, function() {
          sceneRef.setState({
            disabled: false,
          }, function() {
            if (!sceneRef._mdEditorRef) return;
            sceneRef._mdEditorRef.insertImageAtCursor(idx);
          });
        });
      }}
      onSingleUploadedBridge={ (idx, successOrFailure) => {
        if (successOrFailure) sceneRef.onSingleImageUploaded(idx); 
        else sceneRef.onSingleImageUploadError(idx);
      }}
      onSingleNewBundleInitializedBridge={ (idx, props) => {
        const newBundleListManager = sceneRef.state.bundleListManager;
        newBundleListManager.resetAtIndex(idx, props);
        sceneRef.setState({
          bundleListManager: newBundleListManager,
        });
      }}
      onSingleImageEditorTriggeredBridge={ (idx) => {
        sceneRef.setState({
          showImagePreviewer: true, 
          imagePreviewerActiveIndex: idx,
        });
      }}
      onSingleProgressBridge={ (idx, props) => {
        const newBundleListManager = sceneRef.state.bundleListManager;
        newBundleListManager.assignAtIndex(idx, props);
        
        sceneRef.setState({
          bundleListManager: newBundleListManager,
        });
      }}
      {...sceneRef.props}
      />
    );

    let imageList = (null == sceneRef._multiSelectorRef ? null : sceneRef._multiSelectorRef.getPreviewableImageList());
    const imagePreviewer = (
      <ImagePreviewer
        ref={ (c) => {
          if (!c) return;
          sceneRef._imagePreviewerRef = c; 
        }}
        View={View}
        Button={Button} 
        ModalPopup={ModalPopup} 
        Text={Text}
        Image={Image}
        cachedImageList={imageList}
        shouldShow={ () => {
          return sceneRef.state.showImagePreviewer;
        }}
        onHide={ () => {
          sceneRef.setState({
            showImagePreviewer: false,
          });
        }}
        activeIndex={ () => {
          return sceneRef.state.imagePreviewerActiveIndex;
        }}
        onDeleteImageAtActiveIndexBridge={ () => {
          const idx = sceneRef.state.imagePreviewerActiveIndex; 
          const newBundleListManager = sceneRef.state.bundleListManager; 
          const newImageOssFilepathDict = sceneRef.state.cachedImageOssFilepathDict;
          delete newImageOssFilepathDict[idx];
          newBundleListManager.removeAtIndex(idx); 
          if (newBundleListManager.allOccupied() && newBundleListManager.bundleList.length < constants.ATTACHMENT.IMAGE.POLICY.N_PER_ARTICLE) {
            newBundleListManager.pushNew();
          }
          sceneRef.setState({
            savable: sceneRef.isContentValid(sceneRef.state.cachedContent),
            submittable: false,
            showImagePreviewer: false,
            imagePreviewerActiveIndex: null, 
            bundleListManager: newBundleListManager,
            cachedImageOssFilepathDict: newImageOssFilepathDict,
          });
        }}
        shouldDisable={ () => {
          return sceneRef.state.disabled;
        }}
        {...sceneRef.props}
      />
    );

    const titleEditor = (
      <Input
      style={{
        marginTop: 5,
      }}
      disabled={sceneRef.state.disabled}
      key='title-input'
      placeholder={LocaleManager.instance.effectivePack().PLEASE_INPUT_TITLE} 
      value={ sceneRef.state.cachedTitle }
      onUpdated={ (evt) => {
        sceneRef.onTitleChanged(evt.target.value);
      }}
      />
    );

    const keywordListView = (
      <KeywordListView
      View={View}
      Input={Input}
      Button={Button}
      keywordList={sceneRef.state.cachedKeywordList}
      shouldDisable={ () => {
        return sceneRef.state.disabled;
      }}
      maxCount={constants.ARTICLE.CREATION_LIMIT.N_KEYWORDS}
      cachedNewKeyword={sceneRef.state.cachedNewKeyword}
      onSingleKeywordDeleteTriggeredBridge={ (idx) => {
        let newKeywordList = [];
        for (let i = 0; i < sceneRef.state.cachedKeywordList.length; ++i) {
          if (i == idx) continue;
          newKeywordList.push(sceneRef.state.cachedKeywordList[i]);
        }
        sceneRef.setState({
          cachedKeywordList: newKeywordList,
          savable: true,
          submittable: false,
          previewable: false,
        });
      }}
      onNewKeywordAddTriggeredBridge={ (addedNewKeyword) => {
        let newKeywordList = [];
        for (let i = 0; i < sceneRef.state.cachedKeywordList.length; ++i) {
          newKeywordList.push(sceneRef.state.cachedKeywordList[i]);
        }
        newKeywordList.push(addedNewKeyword);
        sceneRef.setState({
          cachedKeywordList: newKeywordList,
          cachedNewKeyword: "",
          savable: true,
          submittable: false,
          previewable: false,
        });
      }}
      onTextChangedBridge={ (cachedNewKeyword) => {
        sceneRef.setState({
          cachedNewKeyword: cachedNewKeyword,
        });
      }} 
      {...sceneRef.props}
      />
    );

    const mdContentEditor = (
      <MarkdownEditor
        key='md-editor'
        style={{
          width: '100%',
        }}
        previewableImageList={imageList}
        shouldDisable={ () => {
          return sceneRef.state.disabled;
        }}
        shouldHideShortcutBar={false}
        text={ sceneRef.state.cachedContent }
        onTextChangedBridge={ (content) => {
          sceneRef.setState({
            cachedContent: content,
            savable: sceneRef.isContentValid(sceneRef.state.cachedTitle, sceneRef.state.cachedContent),
            submittable: false,
            previewable: false,
          });
        }}
        ref={ function(c) {
          if (!c) return;
          sceneRef._mdEditorRef = c;
        }}
        {...sceneRef.props}
      />
    );

    let shouldHideSaveButton = (null !== sceneRef.state.cachedArticle && 
                              (constants.ARTICLE.STATE.CREATED != sceneRef.state.cachedArticle.state && constants.ARTICLE.STATE.DENIED != sceneRef.state.cachedArticle.state && constants.ARTICLE.STATE.ADMIN_SUSPENDED != sceneRef.state.cachedArticle.state && constants.ARTICLE.STATE.AUTHOR_SUSPENDED != sceneRef.state.cachedArticle.state));
    let shouldDisableSaveButton = (sceneRef.state.disabled || !sceneRef.state.savable || shouldHideSaveButton);
    shouldDisableSaveButton = (shouldDisableSaveButton);

    const saveButton = (
      <Button
      disabled={shouldDisableSaveButton}
      style={{
        display: (shouldHideSaveButton ? 'none' : 'block'),
        margin: 5,
      }}
      onPress={ (evt) => {
        sceneRef.setState({
          savable: false,
          submittable: false,
          previewable: false,
          disabled: true,
        }, function() {
          sceneRef._toUploadCount = sceneRef.state.bundleListManager.occupiedCount();
          if (0 == sceneRef._toUploadCount) {
            sceneRef.save();
          } else {
            sceneRef._multiSelectorRef.startUpload();
          }
        });
      }}
      >
        {LocaleManager.instance.effectivePack().SAVE}
      </Button>
    );

    const shouldDisableSubmitButton = (sceneRef.state.disabled || !sceneRef.state.submittable || isNewArticle);
    const submitButton = (
      <Button
      style={{
        display: (shouldDisableSubmitButton ? 'none' : 'inline-block'),
        margin: 5,
      }}
      onPress={ (evt) => {
        sceneRef.submit();
      }}
      >
        {LocaleManager.instance.effectivePack().SUBMIT}
      </Button>
    );

    const shouldDisableSuspendButton = (!sceneRef.state.cachedArticle || constants.ARTICLE.STATE.APPROVED != sceneRef.state.cachedArticle.state);
    const suspendButton = (
      <Button
      style={{
        display: (shouldDisableSuspendButton ? 'none' : 'inline-block'),
        margin: 5,
      }}
      onPress={ (evt) => {
        sceneRef.setState({
          showSuspensionReasonBox: true,
        });
      }}
      >
        {LocaleManager.instance.effectivePack().SUSPEND}
      </Button>
    );

    const shouldDisablePreviewButton = (!sceneRef.state.previewable);

    const notApproved = (null === sceneRef.state.cachedArticle || (constants.ARTICLE.STATE.APPROVED != sceneRef.state.cachedArticle.state));

    let articleStateToDisplayStr = null;
    let negativeReasonStr = null;
    const cachedArticle = sceneRef.state.cachedArticle;
    if ((null != cachedArticle) &&
        (null != cachedArticle.state)) {
        switch (parseInt(cachedArticle.state)) {
        case constants.ARTICLE.STATE.PENDING:
          articleStateToDisplayStr = LocaleManager.instance.effectivePack().PENDING;
        break;
        case constants.ARTICLE.STATE.APPROVED:
          articleStateToDisplayStr = LocaleManager.instance.effectivePack().APPROVED;
        break;
        case constants.ARTICLE.STATE.DENIED:
          articleStateToDisplayStr = LocaleManager.instance.effectivePack().DENIED;
          if (null == cachedArticle.deniedReason) break;
          negativeReasonStr = cachedArticle.deniedReason;
        break;
        case constants.ARTICLE.STATE.ADMIN_SUSPENDED:
          articleStateToDisplayStr = LocaleManager.instance.effectivePack().ADMIN_SUSPENDED;
          if (null == cachedArticle.adminSuspendedReason) break;
          negativeReasonStr = cachedArticle.adminSuspendedReason;
        break;
        case constants.ARTICLE.STATE.AUTHOR_SUSPENDED:
          articleStateToDisplayStr = LocaleManager.instance.effectivePack().AUTHOR_SUSPENDED;
          if (null == cachedArticle.authorSuspendedReason) break;
          negativeReasonStr = cachedArticle.authorSuspendedReason;
        break;
        default:
        break;
        }
    }

    let articleStateToDisplay = null;
    if (null !== articleStateToDisplayStr) {
      articleStateToDisplay = (
        <View
        key='article-state'
        style={{
          fontSize: 16,
          verticalAlign: 'middle',
          height: topbarHeightPx,
          lineHeight: topbarHeightPx,
          textAlign: "center"
        }}>
          {articleStateToDisplayStr}
        </View>
      );
    }

    let negativeReason = null;
    if (null !== negativeReasonStr) {
      const negativeReasonStyle = {
        backgroundColor: constants.THEME.MAIN.RED,
        color: constants.THEME.MAIN.WHITE,
        padding: 5,
        textAlign: "center",
        position: "relative"
      };
      negativeReason = (
        <View
        style={negativeReasonStyle}
        >
          {'⚠'}
          {negativeReasonStr}
        </View>
      );
    }

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

    const topbarChildren = [articleStateToDisplay];
    const topbar = (
      <Topbar
      style={{
        paddingTop: 10
      }}
      {...menuProps}
      >
        {topbarChildren}
      </Topbar>
    );

    // Category picker building.
    let categoryPickerItemList = [];
    categoryChoiceList.map(function(single) {
      const singleCell = (
        <PickerItem
        disabled={sceneRef.state.disabled}
        key={single.title}
        onClick={ (evt) => {
          sceneRef.setState({
            cachedCategory: single.key, 
          });
        }}
        >
        {single.title}
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

    const categoryPicker = (
      <NavItem
        style={{
          display: 'block',
          height: 45,
          lineHeight: '45px',
          width: '15%',
          textAlign: 'center',
        }}
        key='category-picker-nav'>
        <DropdownPicker
        id='category-picker'
        disabled={sceneRef.state.disabled}
        title={effectiveCategoryTitle}
        style={styles.singlePicker}
        >
        {categoryPickerItemList}
        </DropdownPicker>
      </NavItem>
    );

    const namedGatewayInfo = queryNamedGatewayInfoDictSync().articleServer;
    const viewAsPlayerEntry = (
      <HyperLink
      href={namedGatewayInfo.protocol + "://" + namedGatewayInfo.pageGateway + constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.PLAYER + constants.ROUTE_PATHS.ARTICLE + "/" + params.articleId + constants.ROUTE_PATHS.DETAIL}
      style={{
        display: (notApproved ? 'none' : 'block'),
        fontSize: 20,
        width: 128,
      }}
      >
        {LocaleManager.instance.effectivePack().VIEW_AS_PLAYER}
      </HyperLink>
    );

    const suspensionReasonBox = (
      <ConfirmBox
      View={View}
      Button={Button}
      title={LocaleManager.instance.effectivePack().SUSPENSION_REASON}
      Input={Input}
      ModalPopup={ModalPopup}
      show={sceneRef.state.showSuspensionReasonBox}
      onConfirmedBridge={(reason) => {
        sceneRef.setState({
          showSuspensionReasonBox: false,
        }, function() {
          sceneRef.suspend(reason);
        });
      }}
      onHide={() => {
        sceneRef.setState({
          showSuspensionReasonBox: false,
        });
      }}
      inputPlaceHolder={LocaleManager.instance.effectivePack().INPUT_REASON}
      cancelBtnTxt={LocaleManager.instance.effectivePack().CANCEL}
      confirmBtnTxt={LocaleManager.instance.effectivePack().CONFIRM}
      />
    );

    return (
      <View
      style={{
        display: (shouldWaitForCachedArticle ? 'none' : 'block'),
        paddingLeft: 5,
        paddingRight: 5,
      }}>
        {topbar}
        {negativeReason}
        {multiImageSelector}
        {titleEditor}
        {keywordListView}
        {categoryPicker}
        {mdContentEditor}
        {imagePreviewer}
        {saveButton}
        {submitButton}
        {suspendButton}
        {viewAsPlayerEntry}
        {suspensionReasonBox}
      </View>
    );
  }
}

export default Edit;
