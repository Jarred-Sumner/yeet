module.exports = {
  presets: [
    "module:metro-react-native-babel-preset",
    "@babel/preset-typescript",
    "module:react-native-dotenv"
  ],
  plugins: ["import-graphql"]
};
