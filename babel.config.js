const config = {
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

if (process.env.NODE_ENV === "production") {
  config.plugins << "transform-remove-console";
  console.log("[BABEL] Config", config);
}

module.exports = config;
