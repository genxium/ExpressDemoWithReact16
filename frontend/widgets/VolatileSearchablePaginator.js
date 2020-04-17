'use-strict';

import React from 'react';

import ClipartSearch from './ClipartSearch';
import Paginator from './Paginator';

const signals = require('../../common/signals');
const NetworkFunc = require('../../common/NetworkFunc').default;
const constants = require('../../common/constants');

class VolatileSearchablePaginator extends React.Component {

  constructor(props) {
    super(props);

    this._listviewRef = null;
    this.state = {
      activePage: 1,
      searchBarSize: {
        width: '100%',
        height: 0,
      },
      searchKeyword: "",
      cellList: [],
    };
  }

  handleListResponseData(responseData) {
    const widgetRef = this;
    const sceneRef = widgetRef.props.sceneRef;
    const {RoleLoginSingleton, ...other} = sceneRef.props;
    let dataList = widgetRef.props.extractDataListFromRespData(responseData);
    if (!dataList) {
      RoleLoginSingleton.instance.checkWhetherTokenHasExpiredAsync(sceneRef, responseData)
        .then(function(trueOrFalse) {
          if (!trueOrFalse) return;
          RoleLoginSingleton.instance.replaceRoleLoginScene(sceneRef);
        });
      return;
    }
    let newCellList = [];
    dataList.map(function(single) {
      const singleCell = widgetRef.props.createCellReactElement(single, single._id);
      newCellList.push(singleCell);
    });
    widgetRef.setState({
      cellList: newCellList,
    });
  }

  triggerSearch() {
    const widgetRef = this;
    if (!widgetRef._listviewRef) return;
    widgetRef.setState({
      activePage: 1
    }, function() {
      widgetRef._listviewRef.requestDataAsync(widgetRef.state.activePage)
        .then(function(responseData) {
          widgetRef.handleListResponseData(responseData);
        });
    });
  }

  componentDidMount() {
    const widgetRef = this;
    if (!widgetRef._listviewRef) return;
    widgetRef._listviewRef.requestDataAsync(widgetRef.state.activePage)
      .then(function(responseData) {
        widgetRef.handleListResponseData(responseData);
      });
  }

  render() {
    const widgetRef = this;
    const {View, Input, NavItem, dataUrl, sceneRef, nPerPage, noResultHint, totSizePx, cellHeight, getRenderedComponentSize, Topbar, ...other} = widgetRef.props;

    // Search widget building.
    const searchInput = (
    <Input
           key='search-input'
           style={ {
                     height: 23,
                     width: 146,
                     padding: 3,
                     border: 'none',
                     color: constants.THEME.MAIN.BLACK,
                     borderRadius: '4px',
                   } }
           value={ widgetRef.state.searchKeyword }
           onUpdated={ (evt) => {
                         widgetRef.setState({
                           searchKeyword: evt.target.value
                         });
                       } }
           onKeyDown={ (evt) => {
                         if (evt.keyCode != constants.KEYBOARD_CODE.RETURN) return;
                         widgetRef.triggerSearch();
                       } }>
    </Input>
    );

    const searchButton = (
    <View
          key='search-button'
          style={ {
                    display: 'inline-block',
                    width: 18,
                    marginLeft: 10,
                    position: 'absolute',
                  } }
          onClick={ (evt) => {
                      widgetRef.triggerSearch();
                    } }>
      <ClipartSearch />
    </View>
    );

    const searchEntry = (
    <NavItem
             style={ {
                       lineHeight: 1,
                       display: 'block',
                       position: 'absolute',
                       left: '15%',
                       height: 45,
                       paddingTop: 11,
                       paddingBottom: 11,
                       width: '70%',
                       textAlign: 'center',
                       marginLeft: 10,
                     } }
             key='search-entry-nav'>
      { searchInput }
      { searchButton }
    </NavItem>
    );

    const searchBarProps = Object.assign({
      showLoginNav: false,
      onHasLoggedIn: () => {},
      onHasNotLoggedIn: () => {},
      ref: (c) => {
        if (!c) return;
        const newSize = getRenderedComponentSize(c);
        const oldSize = widgetRef.state.searchBarSize;
        if (null !== oldSize && oldSize.width == newSize.width && oldSize.height == newSize.height) return;
        widgetRef.setState({
          searchBarSize: newSize,
        });
      },
    }, widgetRef.props);

    const searchBarChildren = [searchEntry];
    const searchBar = (
    <Topbar
            style={ {
                      width: totSizePx.width,
                    } }
            {...searchBarProps}>
      { searchBarChildren }
    </Topbar>
    );

    const listViewProps = Object.assign({
      cellHeight: cellHeight,
      totSizePx: {
        width: totSizePx.width,
        height: (totSizePx.height - widgetRef.state.searchBarSize.height),
      },
      cellList: widgetRef.state.cellList,
      activePage: () => {
        return widgetRef.state.activePage;
      },
      onPageSelectedBridge: (page) => {
        widgetRef.setState({
          activePage: page,
        }, function() {
          widgetRef._listviewRef.requestDataAsync(widgetRef.state.activePage)
            .then(function(responseData) {
              widgetRef.handleListResponseData(responseData);
            });
        });
      },
      collectFilters: () => {
        const filters = widgetRef.props.collectFilters();
        Object.assign(filters, {
          searchKeyword: widgetRef.state.searchKeyword,
        });
        return filters;
      },
      noResultHint: noResultHint,
      sceneRef: sceneRef,
      dataUrl: dataUrl,
      nPerPage: nPerPage,
      View: View,
      Text: sceneRef.props.Text,
      Image: sceneRef.props.Image,
      Button: sceneRef.props.Button,
      getRenderedComponentSize: getRenderedComponentSize,
    });

    const listview = (
    <Paginator
               style={ {
                         width: totSizePx.width,
                         clear: 'both'
                       } }
               ref={ (c) => {
                       if (!c) return;
                       widgetRef._listviewRef = c;
                     } }
               {...listViewProps} />
    );

    return (
      <View>
        { searchBar }
        { listview }
      </View>
    );
  }
}

export default VolatileSearchablePaginator;
