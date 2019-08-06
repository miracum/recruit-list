module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ["plugin:vue/recommended", "@vue/airbnb"],
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "import/no-unresolved": 0,
    "import/no-unassigned-import": 0,
    quotes: ["error", "double"],
    "linebreak-style": 0,
  },
  parserOptions: {
    parser: "babel-eslint",
  },
};
