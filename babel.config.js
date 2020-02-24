const config = {
  presets: [
    "module:metro-react-native-babel-preset",
    [
      "@babel/preset-typescript",
      {
        allowNamespaces: true
      }
    ]
  ],
  plugins: [
    [
      "import-graphql",
      {
        extensions: [".graphql", ".local.graphql"],
        emitDeclarations: true
      }
    ],
    "@babel/plugin-proposal-optional-chaining",
    "@babel/plugin-proposal-nullish-coalescing-operator",
    ["@babel/plugin-proposal-decorators", { legacy: true }]
  ]
};

if (process.env.NODE_ENV === "production") {
  config.plugins << "transform-remove-console";
  console.log("[BABEL] Config", config);
}

module.exports = config;
