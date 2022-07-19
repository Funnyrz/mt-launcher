const LNDB = require('lndb')
const {app} = require('electron').remote
const db = new LNDB(app.getPath('userData'))
const lnk = db.init('lnkInfo')
module.exports = {lnk}
