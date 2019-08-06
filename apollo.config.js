module.exports = {
  client: {
    service: {
      name: "moveschat",
      url: "http://localhost:3000/api/graphql",
      // optional headers,
      includes: ["lib", "componetns", "pages"],
      output: "./lib/graphql",
      excludes: ["**/*.test.ts", "**/__tests__/*", "node_modules"],
      headers: {
        authorization: "Bearer lkjfalkfjadkfjeopknavadf"
      },
      // optional disable SSL validation check
      skipSSLValidation: true
    }
  }
};
