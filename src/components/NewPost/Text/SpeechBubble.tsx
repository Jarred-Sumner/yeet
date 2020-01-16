import { Svg, Path, G } from "react-native-svg";
import * as React from "react";

// export const SpeechBubble = ({
//   width,
//   height,
//   strokeColor = "#000",
//   fillColor = "#fff",
//   ...otherProps
// }) => {
//   return (
//     <Svg {...otherProps} width={width} height={height} viewBox="0 0 88 110">
//       <G fill="white" fillRule="nonzero" strokeLinejoin="bevel">
//         <Path
//           stroke={strokeColor}
//           strokeWidth={4}
//           d="M28.1838969 4.92938526C32.8045846 36.6434206 24.1793009 88.500154 2 108c33.2689513-26.7855028 69.0022694-71.9994315 81.9401949-97.92779821.9135658 0-8.7624804-1.12123761-20.5926594-2.4000982-21.5220117-2.32656267-50.1734659-5.17480348-35.1636386-2.74271833z"
//         />
//         <Path stroke={fillColor} strokeWidth={5} d="M20.5 5l50 5" />
//         <Path stroke={fillColor} strokeWidth={8} d="M18.5 3l50 5" />
//         <Path stroke={fillColor} strokeWidth={8} d="M32 0l50 10" />
//       </G>
//     </Svg>
//   );
// };

export const SpeechBubble = ({
  width,
  height,
  strokeColor: _strokeColor = "#000",
  fillColor = "#fff",
  ...otherProps
}) => {
  const strokeColor = _strokeColor === "#000000" ? "black" : _strokeColor;

  return (
    <Svg {...otherProps} width={width} height={height} viewBox="0 0 91 68">
      <G fill="white" fillRule="nonzero" strokeLinejoin="bevel">
        <Path
          fill={fillColor}
          fillRule="nonzero"
          stroke={strokeColor}
          strokeLinejoin="bevel"
          strokeWidth={4}
          d="M29.1171208 2.16278249C34.0789657 21.8050033 24.8168553 53.9226886 1 66 36.7252829 49.4102865 75.0968831 21.4068501 88.9900487 5.34800748c.9810166 0-70.9220792-4.2178307-59.8729279-3.185225z"
        />
        <Path stroke={fillColor} strokeWidth={9} d="M32 3l60 2" />
        <Path stroke={fillColor} strokeWidth={9} d="M20 -1l20 2" />
      </G>
    </Svg>
  );
};
