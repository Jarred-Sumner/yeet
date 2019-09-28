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
        authorization:
          "Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwiZW1haWwiOiJqYXJyZWRAamFycmVkc3VtbmVyLmNvbSIsImV4cCI6IjE2MDExODAxOTYifQ.NOOYL-EiC95kh4jcCI5Rbo17kZgEYGMtAiS3kKd0bU8"
      },
      // optional disable SSL validation check
      skipSSLValidation: true
    }
  }
};
