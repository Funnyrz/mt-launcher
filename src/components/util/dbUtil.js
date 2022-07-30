const LNDB = require('lndb')
const db = new LNDB(require('@electron/remote').app.getPath('userData'))
const appInfoDb = db.init('appInfo')
module.exports = {appInfoDb}
