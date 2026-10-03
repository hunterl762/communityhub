const mysql = require('mysql2/promise');
const pool = mysql.createPool({host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,database:process.env.DB_NAME,password:process.env.DB_PASSWORD,waitForConnections:true,connectionLimit:10,queueLimit:0,charset:'utf8mb4'});
module.exports=pool;
