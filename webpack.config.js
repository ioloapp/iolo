const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

// Make network const available in the whole file
const network =
    process.env.DFX_NETWORK ||
    (process.env.NODE_ENV === "production" ? "ic" : "local");

function initCanisterEnv() {
    let localCanisters, prodCanisters;
    try {
        localCanisters = require(path.resolve(
            ".dfx",
            "local",
            "canister_ids.json"
        ));
    } catch (error) {
        console.log("No local canister_ids.json found. Continuing production");
    }
    try {
        prodCanisters = require(path.resolve("canister_ids.json"));
    } catch (error) {
        console.log("No production canister_ids.json found. Continuing with local");
    }

    const canisterConfig = network === "local" ? localCanisters : prodCanisters;

    return Object.entries(canisterConfig).reduce((prev, current) => {
        const [canisterName, canisterDetails] = current;
        prev[canisterName.toUpperCase() + "_CANISTER_ID"] =
            canisterDetails[network];
        return prev;
    }, {});
}
const canisterEnvVariables = initCanisterEnv();

const isDevelopment = process.env.NODE_ENV !== "production";

// Add Internet Identity URL for Safari
//const internetIdentityUrl = network === "local" ? `http://127.0.0.1:4943/?canisterId=${canisterEnvVariables["INTERNET_IDENTITY_CANISTER_ID"]}` : `https://identity.ic0.app`

// Add Internet Identity URL for Chrome/Firefox
const internetIdentityUrl = network === "local" ? `http://${canisterEnvVariables["INTERNET_IDENTITY_CANISTER_ID"]}.localhost:4943` : `https://identity.ic0.app`

const frontendDirectory = "iolo_frontend";

const frontend_entry = path.join("src", frontendDirectory, "src", "index.html");

module.exports = {
    target: "web",
    mode: isDevelopment ? "development" : "production",
    entry: {
        // The frontend.entrypoint points to the HTML file for this build, so we need
        // to replace the extension to `.js`.
        index: path.join(__dirname, frontend_entry).replace(/\.html$/, ".tsx"),
    },
    devtool: isDevelopment ? "source-map" : false,
    optimization: {
        minimize: !isDevelopment,
        minimizer: [new TerserPlugin()],
    },
    resolve: {
        extensions: [".js", ".ts", ".jsx", ".tsx" ],
        fallback: {
            assert: require.resolve("assert/"),
            buffer: require.resolve("buffer/"),
            events: require.resolve("events/"),
            stream: require.resolve("stream-browserify/"),
            util: require.resolve("util/"),
            crypto: require.resolve("crypto-browserify"), // only needed for rsa-keys module
        },
    },
    output: {
        filename: "index.js",
        path: path.join(__dirname, "dist", frontendDirectory),
    },

    // Depending in the language or framework you are using for
    // front-end development, add module loaders to the default
    // webpack configuration. For example, if you are using React
    // modules and CSS as described in the "Adding a stylesheet"
    // tutorial, uncomment the following lines:
    module: {
        rules: [
            { test: /\.(ts|tsx|jsx)$/, loader: "ts-loader" },
            { test: /\.css$/, use: ['style-loader', 'css-loader'] },
            {
                test: /\.(png|jpg|jpeg|gif)$/i,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192, // Convert images smaller than 8kb to base64 strings
                            name: 'images/[name].[ext]', // Output file name and path
                        },
                    },
                ],
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, frontend_entry),
            cache: false,
        }),
        new webpack.EnvironmentPlugin({
            NODE_ENV: "development",
            II_URL: internetIdentityUrl, // Set env variable for Internet Identity URL
            ...canisterEnvVariables,
        }),
        new webpack.ProvidePlugin({
            Buffer: [require.resolve("buffer/"), "Buffer"],
            process: require.resolve("process/browser"),
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: `src/${frontendDirectory}/src/.ic-assets.json*`,
                    to: ".ic-assets.json5",
                    noErrorOnMissing: true
                },
            ],
        }),
    ],
    experiments: {
        asyncWebAssembly: true,
    },
    // proxy /api to port 4943 during development.
    // if you edit dfx.json to define a project-specific local network, change the port to match.
    devServer: {
        proxy: {
            "/api": {
                target: "http://127.0.0.1:4943",
                changeOrigin: true,
                pathRewrite: {
                    "^/api": "/api",
                },
            },
        },
        static: path.resolve(__dirname, "src", frontendDirectory, "assets"),
        hot: true,
        watchFiles: [path.resolve(__dirname, "src", frontendDirectory)],
        liveReload: true,
        historyApiFallback: true,
    },
};
