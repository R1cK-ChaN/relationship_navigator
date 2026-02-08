const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => {
  const isDev = argv.mode === "development";
  const target = (env && env.target) || "addin";

  const includeAddin = target === "addin" || target === "all";
  const includeWebapp = target === "webapp" || target === "all";

  // Build entry points based on target
  const entry = {};
  if (includeAddin) {
    entry.taskpane = "./src/taskpane/index.tsx";
    entry.commands = "./src/commands/commands.ts";
  }
  if (includeWebapp) {
    entry.webapp = "./src/webapp/index.tsx";
  }

  // Build plugins based on target
  const plugins = [];
  if (includeAddin) {
    plugins.push(
      new HtmlWebpackPlugin({
        template: "./src/taskpane/taskpane.html",
        filename: "taskpane.html",
        chunks: ["taskpane"],
      }),
      new HtmlWebpackPlugin({
        template: "./src/commands/commands.html",
        filename: "commands.html",
        chunks: ["commands"],
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: "manifest.xml", to: "manifest.xml" },
          { from: "assets", to: "assets" },
        ],
      })
    );
  }
  if (includeWebapp) {
    plugins.push(
      new HtmlWebpackPlugin({
        template: "./src/webapp/webapp.html",
        filename: "index.html",
        chunks: ["webapp"],
      })
    );
  }

  // Dev server config depends on target
  const devServer = includeWebapp && !includeAddin
    ? {
        port: 3001,
        headers: { "Access-Control-Allow-Origin": "*" },
        static: { directory: path.resolve(__dirname, "dist") },
        hot: true,
      }
    : {
        port: 3000,
        https: true,
        headers: { "Access-Control-Allow-Origin": "*" },
        static: { directory: path.resolve(__dirname, "dist") },
        hot: true,
      };

  return {
    entry,
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].bundle.js",
      clean: true,
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx"],
      alias: {
        "@models": path.resolve(__dirname, "src/models"),
        "@utils": path.resolve(__dirname, "src/utils"),
        "@services": path.resolve(__dirname, "src/services"),
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "babel-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.html$/,
          use: "html-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.(png|jpg|gif|svg)$/,
          type: "asset/resource",
        },
      ],
    },
    plugins,
    devServer,
    devtool: isDev ? "source-map" : false,
  };
};
