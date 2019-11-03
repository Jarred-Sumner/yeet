module.exports = {
  presets: [
    "module:metro-react-native-babel-preset",
    "@babel/preset-typescript"
  ],
  plugins: [
    "import-graphql",
    "@babel/plugin-proposal-optional-chaining",
    "@babel/plugin-proposal-nullish-coalescing-operator"
  ]
};
