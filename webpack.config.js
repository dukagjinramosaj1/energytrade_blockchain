const path = require("path");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: "./app/src/app.js",
  output: {
    filename: "app.js",
    path: path.resolve(__dirname, "./dist"),
  },

    module:{
        rules:[
            {
                test:/\.css$/,
                use:['style-loader','css-loader']
            }
       ]
    },


  plugins: [
    
   new CopyWebpackPlugin([
    { from: "./app/src/index.html", to: "index.html" },
    { from: "./app/src/sell.html", to: "sell.html" },
    { from: "./app/src/buy.html", to: "buy.html" },
    { from: "./app/src/register.html", to: "register.html" },
    { from: "./app/src/css/style.css", to: "style.css" },
      ]),


     ],


  devServer: { contentBase: path.join(__dirname, "dist"), compress: true },
};
