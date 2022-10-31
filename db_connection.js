const mysql = require('mysql');

function dataBaseConnetion() {

    var con = mysql.createConnection({
        host: "localhost",
        user: "henmzpyq_techo_app",
        password: "biggerguy123$",
        database: "henmzpyq_techo_app"
    });

    return con;
}


module.exports.dataBaseConnetion = dataBaseConnetion;