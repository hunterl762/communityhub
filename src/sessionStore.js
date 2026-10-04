const session=require('express-session');
const Sequelize=require('sequelize');
const SequelizeStore=require('connect-session-sequelize')(session.Store);

const sequelize=new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:process.env.DB_HOST||'127.0.0.1',
    port:Number(process.env.DB_PORT||3306),
    dialect:'mysql',
    logging:false,
    pool:{max:5,min:0,acquire:30000,idle:10000},
    dialectOptions:{charset:'utf8mb4'}
  }
);

const store=new SequelizeStore({
  db:sequelize,
  tableName:'web_sessions',
  checkExpirationInterval:15*60*1000,
  expiration:30*24*60*60*1000
});

async function initializeSessionStore(){
  await sequelize.authenticate();
  await store.sync();
  console.log('[Community Hub] Persistent MySQL session store ready');
}

module.exports={store,initializeSessionStore};