

const path = require('path');

module.exports = {
  entry: {
    background: { import: 'src/background.ts', runtime: false },
    content: { import: 'src/content_scripts/content_script.ts', runtime: false }
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist/track')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  }
}