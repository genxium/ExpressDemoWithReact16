'use-strict';

import React from 'react';

try {
  // Needs feasible css-loader.
  require('./ClipartAddImage.css');
} catch (err) {
  // Error handling here.
}

class ClipartAddImage extends React.Component {
  render() {
    const widgetRef = this;
    return (
      <div style={ widgetRef.props.style }>
        <svg
             height="70px"
             width="70px"
             version="1.1"
             viewBox="0 0 70 70">
          <defs/>
          <g
             id="add-image-container"
             fill="none"
             stroke="none"
             strokeWidth="1">
            <g
               id="add-image"
               fill="#DEDEDE"
               transform="translate(-425.000000, -391.000000)">
              <g
                 id="Group"
                 transform="translate(315.000000, 150.000000)">
                <g
                   id="Group-8"
                   transform="translate(45.000000, 176.000000)">
                  <g
                     id="clipart-add_image"
                     transform="translate(65.000000, 65.000000)">
                    <rect
                          height="70"
                          id="Rectangle-6"
                          width="4"
                          x="33"
                          y="0" />
                    <rect
                          height="70"
                          id="Rectangle-6"
                          width="4"
                          transform="translate(35.000000, 35.000000) rotate(90.000000) translate(-35.000000, -35.000000) "
                          x="33"
                          y="0" />
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

export default ClipartAddImage;
