'use-strict';

import React from 'react';

try {
  // Needs feasible css-loader.
  require('./ClipartDelete.css');
} catch (err) {
  // Error handling here.
}

class ClipartDelete extends React.Component {
  render() {
    const widgetRef = this;
    return (
      <div style={ widgetRef.props.style }>
        <svg
             height="57px"
             width="57px"
             version="1.1"
             viewBox="0 0 57 57">
          <defs/>
          <g
             id="clipart-delete-outermost"
             fill="none"
             stroke="none"
             strokeWidth="1">
            <g
               id="clipart-delete-container"
               transform="translate(-19.000000, -411.000000)">
              <g
                 id="Group-9"
                 transform="translate(20.000000, 412.000000)">
                <g
                   id="clipart-delete"
                   fill="#FFFFFF"
                   transform="translate(15.000000, 13.000000)">
                  <g
                     id="Group"
                     transform="translate(0.081983, 0.008391)">
                    <path
                          id="Shape"
                          d="M6.21759862,4.13779245 L2.08912037,4.13992022 C0.959171248,4.13992022 0.017210407,5.05995577 0.017210407,6.19492601 L0.017210407,8.2499318 L24.8187934,8.2499318 L24.8187934,6.19492601 C24.8187934,5.05207403 23.8911495,4.13992022 22.7468834,4.13992022 L18.6184052,4.13992022 L18.6184052,2.08278667 C18.6184052,0.939605035 17.7016119,0.0299386161 16.5706682,0.0299386161 L8.26536579,0.0299386161 C7.14970341,0.0299386161 6.21762876,0.94901517 6.21762876,2.08278667 L6.21762876,4.13779245 L6.21759862,4.13779245 Z M21.7186294,10.3049076 L21.7186294,26.7542741 C21.7186294,27.8839999 20.8710395,28.7998099 19.8670489,28.7998099 L4.96895496,28.7998099 C3.94636743,28.7998099 3.11737437,27.8634115 3.11737437,26.7542741 L3.11737437,10.3049076 L21.7185692,10.3049076 L21.7186294,10.3049076 Z" />
                  </g>
                </g>
                <circle
                        id="Oval-4"
                        cx="27.5"
                        cy="27.5"
                        r="27.5"
                        stroke="#FFFFFF" />
              </g>
            </g>
          </g>
        </svg>
      </div>
    );
  }
}

export default ClipartDelete;
