/*
* Don't import the whole of this "WebCommonRouteProps" in any "*_console" and try to import as-less-as-possible in your landing page. 
*
* -- YFLu, 2020-02-06.
*/

import React from 'react';

import Modal from 'react-modal';
Modal.setAppElement('#react-root'); // This is a dirty fix. -- YFLu, 2020-02-05.

import { getRenderedComponentSize, } from 'crimson-react-widgets/lib/util';
/*
It's by practice that the following snippet will import the whole module size of 'crimson-react-widgets' for this 'WebCommonRouteProps',

```
import {
  getRenderedComponentSize,
} from 'crimson-react-widgets';
```

PROBABLY due to that each of 'crimson-react-widgets/lib/[^(index.js)]' is still exporting in "CommonJsModule" syntax, and thus "Webpack toolchain & configs of this commit" is not capable of recognizing such partial import continuations.
*/

import DropdownButton from 'react-bootstrap/DropdownButton';
import MenuItem from 'react-bootstrap/DropdownItem';
/*
It's by the same bundle size argument that the following snippet

```
import {
  DropdownButton,
  DropdownItem as MenuItem
} from 'react-bootstrap';
```
is NOT USED, and the comparison of tested outcomes is as expected (using "Webpack toolchain & configs of this commit").
*/

const createReactClass = require('create-react-class');
const constants = require('../../common/constants');
const NetworkFunc = require('../../common/NetworkFunc').default;

const queryNamedGatewayInfoDictSync = function() {
  const jsonEncodedStr = document.getElementById('named-gateway-info').content;
  const dict = JSON.parse(jsonEncodedStr);
  return dict;
};

class StatelessTopbar extends React.Component {
  componentDidMount() {
    const {onHasLoggedIn, onHasNotLoggedIn, sceneRef, ...other} = this.props;
    const accManager = (null == sceneRef.RoleLoginSingleton ? sceneRef.props.RoleLoginSingleton.instance : sceneRef.RoleLoginSingleton.instance);
    accManager.loadLoggedInRoleAsync(sceneRef)
      .then(function() {
        if (accManager.hasLoggedIn()) {
          if (null == onHasLoggedIn) {
            return;
          }
          onHasLoggedIn();
          return;
        }
        accManager.loginByIntAuthTokenAsync(sceneRef)
          .then(function(hasLoggedIn) {
            if (hasLoggedIn && null != onHasLoggedIn) onHasLoggedIn();
            if (!hasLoggedIn && null != onHasNotLoggedIn) onHasNotLoggedIn();
          });
      });
  }

  render() {
    const widgetRef = this;
    const {style, sceneRef, children, ...other} = widgetRef.props;

    const outerMostStyle = Object.assign({
      width: '100%',
      color: constants.THEME.MAIN.WHITE,
      paddingTop: 5,
      paddingBottom: 5,
      marginBottom: 0,
      height: topbarHeightPx,
      backgroundColor: constants.THEME.MAIN.BLACK,
    }, style);

    // NOTE: Returning.
    return (
      <div style={ outerMostStyle }>
        { children }
      </div>
    );
  }
}

class ModalPopup extends React.Component {
  // Reference https://github.com/reactjs/react-modal/blob/master/README.md

  constructor(props) {
    super(props);
    const overflowStyle = (undefined === props.overflowStyle ? 'inherit' : props.overflowStyle);
    this.style = {
      overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
      content: {
        position: 'absolute',
        left: '10px',
        right: '10px',
        bottom: 'auto',
        border: '1px solid #ccc',
        borderRadius: '8px',
        background: '#fff',
        overflow: overflowStyle,
        WebkitOverflowScrolling: 'touch',
        outline: 'none',
        padding: '0px'
      }
    };
  }

  render() {
    const {onHide, isStatic, title, show, children, footer, style, ...other} = this.props;
    let header = (
    <h3 style={ {
              padding: '5px',
              textAlign: 'center'
            } }>{ title }</h3>
    );

    if (null == title || "" == title) {
      header = null;
    }

    let modalStyle = this.style;
    if (null != style) {
      const contentStyle = Object.assign(this.style.content, style.content);
      const overlayStyle = Object.assign(this.style.overlay, style.overlay);
      modalStyle = {
        content: contentStyle,
        overlay: overlayStyle
      };
    }

    return (
      <Modal
             style={ modalStyle }
             isOpen={ show }
             onRequestClose={ onHide }
             shouldCloseOnOverlayClick={ !isStatic }>
        { header }
        { children }
        { footer }
      </Modal>
    );
  }
}

class StyleSheet {
  static create(s) {
    return s;
  }
}

class Input extends React.Component {
  constructor(props) {
    super(props);
    this._inputRef = null;
  }

  get value() {
    if (null == this._inputRef || null == this._inputRef.value) {
      return "";
    }
    return this._inputRef.value;
  }

  render() {
    const widgetRef = this;
    /*
    If an <Input /> is expected to be "uncontrolled component (https://reactjs.org/docs/uncontrolled-components.html)", pass in a "ref method" in "widgetRef.props". 
    */
    const {onUpdated, ...other} = widgetRef.props;
    return (
      <input
             onChange={ (evt) => {
                          onUpdated(evt);
                        } }
             onCut={ (evt) => {
                       onUpdated(evt);
                     } }
             onPaste={ (evt) => {
                         onUpdated(evt);
                       } }
             {...other} />
    );
  }
}

const topbarHeightPx = '55px';

const NavItem = createReactClass({
  render: function() {
    const {onClick, children, style, ...other} = this.props;
    const outerMostStyle = Object.assign({
      display: 'inline-block',
      height: topbarHeightPx,
      lineHeight: topbarHeightPx,
    }, style);
    return (
      <div
           style={ outerMostStyle }
           onClick={ onClick }>
        { children }
      </div>
    );
  }
});

const View = createReactClass({
  render: function() {
    const {idx, ...other} = this.props;
    return (
      <div {...other}>
        { this.props.children }
      </div>
    );
  }
});

const Text = createReactClass({
  render: function() {
    return (
      <span {...this.props}>{ this.props.children }</span>
    );
  }
});

const Image = createReactClass({
  getInitialState: function() {
    return {
      src: null,
      srcset: null,
    };
  },
  changeSrc: function(newSrc) {
    this.setState({
      src: newSrc
    });
  },
  changeSrcset: function(newSrcset) {
    this.setState({
      srcset: newSrcset
    });
  },
  render: function() {
    const {src, srcset, ...other} = this.props;
    const finalizedSrc = (null == this.state.src ? src : this.state.src);
    const finalizedSrcset = (null == this.state.srcset ? srcset : this.state.srcset);
    return (
      <img
           src={ finalizedSrc }
           srcSet={ finalizedSrcset }
           {...other}>{ this.props.children }</img>
    );
  }
});

const Video = createReactClass({
  getInitialState: function() {
    return {};
  },
  render: function() {
    const props = this.props;
    return (
      <video {...props} />
    );
  }
});

const HyperLink = createReactClass({
  render: function() {
    const {idx, href, ...other} = this.props;
    return (
      <a
         href={ href }
         {...other}>
        { this.props.children }
      </a>
    );
  }
});

const DropdownPicker = createReactClass({
  render: function() {
    const {id, title, children, style, ...other} = this.props;
    return (
      <DropdownButton
                      id={ id }
                      title={ title }
                      style={ style }
                      {...other}>
        { children }
      </DropdownButton>
    );
  }
});

const PickerItem = createReactClass({
  render: function() {
    const {children, ...other} = this.props;
    return (
      <MenuItem {...other}>
        { children }
      </MenuItem>
    );
  }
});

const getRootElementSize = function() {
  const width = "innerWidth" in window
    ? window.innerWidth
    : document.documentElement.offsetWidth;
  const height = "innerHeight" in window
    ? window.innerHeight
    : document.documentElement.offsetHeight;
  return {
    width: width,
    height: height,
  }
};

const Button = createReactClass({
  render: function() {
    return (
      <button
              onClick={ this.props.onPress }
              style={ this.props.style }
              disabled={ this.props.disabled }>
        { this.props.children }
      </button>
    );
  }
});

const goBack = function(sceneRef) {
  sceneRef.props.history.goBack();
};

const pushNewScene = function(sceneRef, pathname, paramDict) {
  const searchStr = (null == paramDict || 0 >= Object.keys(paramDict).length ? "" : "?" + NetworkFunc.mapToSortedQueryParams(paramDict))
  sceneRef.props.history.push(pathname + searchStr);
};

const replaceNewScene = function(sceneRef, pathname, paramDict) {
  const searchStr = (null == paramDict || 0 >= Object.keys(paramDict).length ? "" : "?" + NetworkFunc.mapToSortedQueryParams(paramDict))
  if (pathname.startsWith("http:") || pathname.startsWith("https:")) {
    /*
    * History API "pushState" only accepts "different path under same origin".
    * Reference https://developer.mozilla.org/en-US/docs/Web/API/History/pushState.
    */
    window.location.replace(pathname + searchStr);
  } else {
    sceneRef.props.history.replace(pathname + searchStr);
  }
};

const dialPhoneNumber = function(phoneNumber) {
  window.location = "tel:" + phoneNumber;
};

const changeSceneTitle = function(sceneRef, title) {
  // Reference http://stackoverflow.com/questions/33866140/how-to-dynamically-change-document-title-in-js-so-wechat-browser-will-detect-it.
  document.title = title;
  const iframe = document.createElement('iframe');

  let _l = null;
  _l = function() {
    window.setTimeout(function() {
      iframe.removeEventListener('load', _l);
      document.body.removeChild(iframe);
    }, 0);
  }

  iframe.addEventListener('load', _l);
  /*
    // NOTE: Loading a blank page, i.e. `about:blank` DOESN'T work!!! 
    iframe.setAttribute("src", 'about:blank');
  */
  iframe.setAttribute("src", constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.ICON + constants.ICON.CLIPART_TRIANGLE);
  iframe.style.display = "none";
  document.body.appendChild(iframe);
};

const queryWeChatPubsrvWebLoginInfoDictSync = function() {
  const jsonEncodedStr = document.getElementById('wechat-pubsrv-web-login-info').content;
  const dict = JSON.parse(jsonEncodedStr);
  return dict;
};

/*
Don't "export default {a JSObject}", which prohibits further partial imports.
*/
export { View, Text, Image, Video, Input, StatelessTopbar as Topbar, NavItem, HyperLink, DropdownPicker, PickerItem, StyleSheet, getRootElementSize, getRenderedComponentSize, Button, goBack, pushNewScene, replaceNewScene, ModalPopup, dialPhoneNumber, changeSceneTitle, queryWeChatPubsrvWebLoginInfoDictSync, queryNamedGatewayInfoDictSync, topbarHeightPx, };
