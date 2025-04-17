/**
 * Configuration for the SOLID checker
 */

/**
 * @type {import('./interfaces').IConfig}
 */
const config = {
    maxFileLength: 80,
    excludePatterns: [
        /\.test\.(ts|js)$/,
        /\.spec\.(ts|js)$/,
        /node_modules/,
        /\.git/,
        /\.vscode/,
        /out\//,
        /dist\//
    ]
};

module.exports = config;
