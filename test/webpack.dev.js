module.exports = [
    //Export for server seperate html js and css files
    {
        mode: 'development',
        devServer: {
            host: '0.0.0.0',
            port: 666,
            allowedHosts: 'auto',
            client: { overlay: true, },
            hot: false,
        },
        devtool: "source-map",
        entry: './test/main.js',
        module: {
            rules: [{
                test: /\.scss$/,
                use: [
                    "style-loader",
                    "css-loader",
                    'sass-loader',
                ],
            }, {
                test: /\.css$/,
                use: [
                    "style-loader",
                    "css-loader",
                ],
            }, {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            }, ]
        },
    }
];