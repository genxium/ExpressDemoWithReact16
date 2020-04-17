import React from 'react';
const Component = React.Component;

import constants from '../../common/constants';
import { View } from '../widgets/WebCommonRouteProps';

class Loading extends Component {
  render() {
    const sceneRef = this;
    return (
      <View style={ {
                padding: 64
              } }>
        ...
      </View>
    );
  }
}

export default Loading;
