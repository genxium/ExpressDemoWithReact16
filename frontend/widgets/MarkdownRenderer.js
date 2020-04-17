'use strict'

import React from 'react';

import { YAMDRenderer, } from 'crimson-react-widgets';

class MarkdownRenderer extends React.Component {
  render() {
    const widgetRef = this;
    const {style, ...other} = widgetRef.props;

    return (
      <YAMDRenderer
                    imgTag='iimag'
                    videoTag='pvd'
                    ktxTag='katex'
                    mermaidTag='mermaid'
                    alignCenterTag='algctr'
                    {...other}/>
    );
  }
}

export default MarkdownRenderer;
