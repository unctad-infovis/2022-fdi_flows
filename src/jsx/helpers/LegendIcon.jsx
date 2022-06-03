import React from 'react';

const legendIcon = (symbol, color) => {
  if (symbol === 'square') {
    return (<svg><path fill="none" d="M 0 11 L 16 11" stroke={color} strokeWidth="2"></path><path fill={color} d="M 4 7 L 12 7 L 12 15 L 4 15 Z" opacity="1"></path></svg>);
  }
  else if (symbol === 'circle') {
    return (<svg><path fill="none" d="M 0 11 L 16 11" stroke={color} strokeWidth="2"></path><path fill={color} d="M 8 15 A 4 4 0 1 1 8.003999999333336 14.999998000000167 Z" opacity="1"></path></svg>);
  }
  else if (symbol === 'diamond') {
    return (<svg><path fill="none" d="M 0 11 L 16 11" stroke={color} strokeWidth="2"></path><path fill={color} d="M 8 7 L 12 11 L 8 15 L 4 11 Z" opacity="1"></path></svg>);
  }
  else if (symbol === 'triangle-down') {
    return (<svg><path fill="none" d="M 0 11 L 16 11" stroke={color} strokeWidth="2"></path><path fill={color} d="M 4 7 L 12 7 L 8 15 Z" opacity="1"></path></svg>);
  }
  else if (symbol === 'triangle') {
    return (<svg><path fill="none" d="M 0 11 L 16 11" stroke={color} strokeWidth="2"></path><path fill={color} d="M 8 7 L 12 15 L 4 15 Z" opacity="1"></path></svg>);
  }
}
export default legendIcon;