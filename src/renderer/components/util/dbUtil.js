const LNDB = require('lndb')
const {app} = require('electron').remote
const db = new LNDB(app.getPath('userData'))
const appInfoDb = db.init('appInfo')
module.exports = {appInfoDb}
