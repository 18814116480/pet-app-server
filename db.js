const { Sequelize, DataTypes } = require("sequelize");

// 从环境变量中读取数据库配置
const { MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_ADDRESS = "" } = process.env;

const [host, port] = MYSQL_ADDRESS.split(":");

const sequelize = new Sequelize("nodejs_demo", MYSQL_USERNAME, MYSQL_PASSWORD, {
  host,
  port,
  dialect: "mysql" /* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */,
});

// 定义数据模型
const Counter = sequelize.define("Counter", {
  count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});

// 定义宠物模型 (对应小程序前端数据结构)
const Pet = sequelize.define("Pet", {
  // id: Sequelize 默认自动创建主键 id (INTEGER, Auto Increment)
  url: { type: DataTypes.STRING, allowNull: false, comment: '封面图片' },
  nickname: { type: DataTypes.STRING, allowNull: false, comment: '昵称' },
  breed: { type: DataTypes.STRING, allowNull: false, comment: '品种' },
  age: { type: DataTypes.STRING, allowNull: false, comment: '年龄' },
  gender: { type: DataTypes.STRING, allowNull: false, comment: '性别' },
  location: { type: DataTypes.STRING, allowNull: false, comment: '位置' },
  tags: { 
    type: DataTypes.JSON, // 使用 JSON 存储数组 ['活泼好动', '亲人']
    allowNull: true,
    comment: '标签' 
  },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: '寻找中', comment: '状态' },
  desc: { type: DataTypes.TEXT, allowNull: true, comment: '描述信息' }
});

// 定义收藏模型
const Collect = sequelize.define("Collect", {
  userId: { type: DataTypes.STRING, allowNull: false, comment: '收藏者的用户ID' },
  petId: { type: DataTypes.INTEGER, allowNull: false, comment: '被收藏的宠物ID' }
});

// 建立表关联：一个宠物可以被多次收藏
Pet.hasMany(Collect, { foreignKey: 'petId' });
Collect.belongsTo(Pet, { foreignKey: 'petId' });

// 数据库初始化方法
async function init() {
  await Counter.sync({ alter: true });
  await Pet.sync({ alter: true }); // 同步 Pet 表结构到数据库
  await Collect.sync({ alter: true }); // 同步 Collect 表结构到数据库
}

// 导出初始化方法和模型
module.exports = {
  init,
  Counter,
  Pet,
  Collect
};
