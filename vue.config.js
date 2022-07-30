module.exports = {
    pluginOptions: {
        electronBuilder: {
            nodeIntegration: true,
            externals: ['icon-promise', 'lndb'],
            builderOptions: {
                // asarUnpack: [
                //     "node_modules/icon-promise/**/*"
                // ],
            },
        }
    }
}