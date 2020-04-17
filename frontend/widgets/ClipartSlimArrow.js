'use-strict';

import React from 'react';

try {
  // Needs feasible css-loader.
  require('./ClipartSlimArrow.css');
} catch (err) {
  // Error handling here.
}

class ClipartSlimArrow extends React.Component {
  render() {
    const widgetRef = this;
    return (
      <div style={ widgetRef.props.style }>
        <svg
             height="21px"
             width="13px"
             version="1.1"
             viewBox="0 0 13 21">
          <defs />
          <g
             id="slim-arrow"
             fill="none"
             stroke="none"
             strokeWidth="1">
            <g
               id="slim-arrow-1"
               fill="#F9C349"
               transform="translate(-272.000000, -701.000000)">
              <g
                 id="slim-arrow-2"
                 transform="translate(130.000000, 701.000000)">
                <g
                   id="Group"
                   transform="translate(0.126359, 0.000000)">
                  <g id="Group-4">
                    <path
                          id="clipart-page_down_clickable"
                          d="M142.414287,18.605379 L150.585861,10.4999528 L142.414287,2.39454751 C141.861904,1.84690938 141.861904,0.958676258 142.414287,0.410618429 C142.966394,-0.13687281 143.862003,-0.13687281 144.414259,0.410618429 L153.585808,9.50807218 C154.138064,10.0559831 154.138064,10.9440693 153.585808,11.4918544 L144.414259,20.5891612 C143.862003,21.1369463 142.966394,21.1369463 142.414287,20.5891612 C141.861904,20.0413972 141.861904,19.1531641 142.414287,18.605379 L142.414287,18.605379 Z" />
                  </g>
                </g>
              </g>
            </g>
          </g>
        </svg>
      </div>
    );
  }
}

export default ClipartSlimArrow;
