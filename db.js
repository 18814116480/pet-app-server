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
  swiperList: { type: DataTypes.JSON, allowNull: true, comment: '轮播图列表' },
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
  health: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '健康状态'
  },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: '寻找中', comment: '状态' },
  desc: { type: DataTypes.TEXT, allowNull: true, comment: '描述信息' }
});

// 定义收藏模型
const Collect = sequelize.define("Collect", {
  userId: { type: DataTypes.STRING, allowNull: false, comment: '收藏者的用户ID' },
  petId: { type: DataTypes.INTEGER, allowNull: false, comment: '被收藏的宠物ID' }
});

// 定义用户模型
const User = sequelize.define("User", {
  openid: { type: DataTypes.STRING, allowNull: false, unique: true, comment: '微信 OpenID' },
  accountId: { type: DataTypes.STRING, allowNull: false, unique: true, comment: '唯一账号ID' },
  nickname: { type: DataTypes.STRING, allowNull: true, comment: '昵称' },
  avatarUrl: { type: DataTypes.STRING, allowNull: true, comment: '头像' },
  gender: { type: DataTypes.INTEGER, allowNull: true, comment: '性别' },
  birth: { type: DataTypes.STRING, allowNull: true, comment: '生日' },
  address: { type: DataTypes.JSON, allowNull: true, comment: '地址' },
  introduction: { type: DataTypes.TEXT, allowNull: true, comment: '简介' },
  wechatId: { type: DataTypes.STRING, allowNull: true, comment: '微信号' }
});

// 建立表关联：一个宠物可以被多次收藏
Pet.hasMany(Collect, { foreignKey: 'petId' });
Collect.belongsTo(Pet, { foreignKey: 'petId' });

// 建立宠物和用户的关联（可选，但很有用）：一个用户发布多个宠物
User.hasMany(Pet, { foreignKey: 'publisherId', sourceKey: 'openid' });
Pet.belongsTo(User, { foreignKey: 'publisherId', targetKey: 'openid' });

// 数据库初始化方法
async function init() {
  await Counter.sync({ alter: true });
  await User.sync({ alter: true }); // 同步 User 表结构到数据库
  await Pet.sync({ alter: true }); // 同步 Pet 表结构到数据库
  await Collect.sync({ alter: true }); // 同步 Collect 表结构到数据库
}

// 导出初始化方法和模型
module.exports = {
  init,
  Counter,
  Pet,
  Collect,
  User
};
