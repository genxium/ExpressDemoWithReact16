import React from 'react';

import { Paginator as CrimsonPaginator } from 'crimson-react-widgets';

import IgBackgroundOfEmptyList1 from './IgBackgroundOfEmptyList1';
import ClipartSlimArrow from './ClipartSlimArrow';

import { View, Text, Image, Button, } from './WebCommonRouteProps';

class Paginator extends React.Component {

  constructor(props) {
    super(props);

    this._cp = null;
  }

  requestDataAsync(requestedPage) {
    const widgets = this;
    return widgets._cp.requestDataAsync(requestedPage);
  }

  render() {
    const widgets = this;
    const props = widgets.props;
    return (
      <CrimsonPaginator
                        ref={ (c) => {
                                if (!c) return;
                                widgets._cp = c;
                              } }
                        View={ View }
                        Text={ Text }
                        Image={ Image }
                        Button={ Button }
                        noResultHintIcon={ IgBackgroundOfEmptyList1 }
                        BackArrow={ ClipartSlimArrow }
                        {...props} />
    );
  }
}

export default Paginator;
