const webpack = require("webpack");

module.exports = {
  transpileDependencies: ["fhirpath", "fhirclient", "debug", "@lhncbc/ucum-lhc"],
  configureWebpack: {
    resolve: {
        alias: {
            process: 'process/browser',
            stream: "stream-browserify",
            zlib: "browserify-zlib"
          },
          fallback: {
              fs: false,
              crypto: false //<----- adding this line removed the warning
          }
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: "process/browser",
        Buffer: ["buffer", "Buffer"],
      }),
    ],
  },
};
