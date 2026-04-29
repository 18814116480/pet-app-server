const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { init: initDB, Counter, Pet, Collect, User } = require("./db");
const { Sequelize, Op } = require("sequelize");

const logger = morgan("tiny");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

// 首页
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 更新计数
app.post("/api/count", async (req, res) => {
  const { action } = req.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }
  res.send({
    code: 0,
    data: await Counter.count(),
  });
});

// 获取计数
app.get("/api/count", async (req, res) => {
  const result = await Counter.count();
  res.send({
    code: 0,
    data: result,
  });
});

// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  }
});

// ---------------- 用户信息相关接口 ----------------

function generateAccountId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let accountId = '';
  for (let i = 0; i < 8; i++) {
    accountId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return accountId;
}

// 获取个人信息
app.get("/api/user/info", async (req, res) => {
  try {
    const openid = req.headers["x-wx-openid"] || 'mock_user_id';
    let user = await User.findOne({ where: { openid } });
    
    if (!user) {
      // 如果没有，则创建默认用户，生成唯一的 accountId
      const accountId = generateAccountId();
      user = await User.create({
        openid,
        accountId,
        nickname: '微信用户',
        avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
      });
    }

    const userData = user.toJSON();
    // 格式化 createdAt 时间，如 2023-10-01
    if (userData.createdAt) {
      const date = new Date(userData.createdAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      userData.joinTime = `${year}-${month}-${day}`;
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: userData
    });
  } catch (error) {
    console.error("获取用户信息失败:", error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 更新个人信息
app.post("/api/user/info", async (req, res) => {
  try {
    const openid = req.headers["x-wx-openid"] || 'mock_user_id';
    const { nickname, avatarUrl, gender, birth, address, introduction } = req.body;
    
    let user = await User.findOne({ where: { openid } });
    if (!user) {
      user = await User.create({
        openid,
        accountId: generateAccountId(),
        nickname: nickname || '微信用户',
        avatarUrl: avatarUrl || ''
      });
    }

    await user.update({
      nickname: nickname !== undefined ? nickname : user.nickname,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : user.avatarUrl,
      gender: gender !== undefined ? gender : user.gender,
      birth: birth !== undefined ? birth : user.birth,
      address: address !== undefined ? address : user.address,
      introduction: introduction !== undefined ? introduction : user.introduction
    });

    const userData = user.toJSON();
    if (userData.createdAt) {
      const date = new Date(userData.createdAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      userData.joinTime = `${year}-${month}-${day}`;
    }

    res.json({
      code: 200,
      message: '更新成功',
      data: userData
    });
  } catch (error) {
    console.error("更新用户信息失败:", error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 注销个人账号
app.delete("/api/user/account", async (req, res) => {
  try {
    const openid = req.headers["x-wx-openid"] || 'mock_user_id';
    
    // 1. 删除用户记录
    const deletedUserCount = await User.destroy({ where: { openid } });
    if (deletedUserCount === 0) {
      return res.status(404).json({ code: 404, message: '账号不存在或已注销' });
    }

    // 2. 这里可以根据业务需求决定是否级联删除用户发布的宠物和收藏
    // 比如：
    // await Pet.destroy({ where: { publisherId: openid } }); // 但需要注意我们的 publisherId 存的是 accountId
    
    res.json({
      code: 200,
      message: '账号注销成功'
    });
  } catch (error) {
    console.error("账号注销失败:", error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取首页轮播图
app.get("/api/home/swipers", async (req, res) => {
  try {
    // 这里简单起见，我们返回静态配置的轮播图。
    // 后续你也可以在 MySQL 里新建一张 Swiper 表来管理它们。
    const swipers = [
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ];
    res.json({
      code: 200,
      message: '获取轮播图成功',
      data: swipers
    });
  } catch (error) {
    console.error("获取轮播图失败:", error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
});

// 获取宠物列表数据（从真实 MySQL 数据库查询）
app.get("/api/pets", async (req, res) => {
  try {
    const { publisherId } = req.query;
    const where = {};
    if (publisherId) {
      // 检查 publisherId 是否是 accountId
      const user = await User.findOne({ where: { accountId: publisherId } });
      if (user) {
        // 兼容之前可能用 accountId 存入 Pet 的旧数据
        where.publisherId = {
          [Op.or]: [user.openid, publisherId]
        };
      } else {
        where.publisherId = publisherId;
      }
    }

    const pets = await Pet.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [{ model: User }] // 关联查询发布者信息
    });
    
    // 如果数据库里一条数据都没有，自动插入几条测试数据以便我们看到效果
    if (pets.length === 0) {
      return res.json({
        code: 200,
        message: '请求成功',
        data: []
      });
    }

    res.json({
      code: 200,
      message: '请求成功',
      data: pets
    });
  } catch (error) {
    console.error("数据库查询失败:", error);
    res.status(500).json({
      code: 500,
      message: '数据库查询失败',
      error: error.message
    });
  }
});

// 发布宠物接口（写入 MySQL 数据库）
app.post("/api/pets", async (req, res) => {
  try {
    const { url, nickname, category, breed, age, gender, location, latitude, longitude, tags, health, status, desc, swiperList } = req.body;
    const publisherId = req.headers["x-wx-openid"] || 'mock_user_id'; // 当前用户ID作为发布者
    
    // 如果年龄没传，默认设置为“未知”
    const finalAge = age || '未知';

    // 简单的参数校验
    if (!nickname || !breed || !category) {
      return res.status(400).json({
        code: 400,
        message: '昵称、分类、品种为必填项'
      });
    }

    // 在数据库中创建新宠物记录
    const newPet = await Pet.create({
      url: url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', // 默认图片
      swiperList: swiperList || [url], // 如果前端传了轮播图数组就存下来
      nickname,
      category,
      breed,
      age: finalAge,
      gender: gender || 'unknown',
      location: location || '未知位置',
      latitude,
      longitude,
      tags: tags || [],
      health: health || ['未打疫苗', '未驱虫', '未绝育'],
      status: status || '寻找中',
      desc: desc || '',
      publisherId
    });

    res.json({
      code: 200,
      message: '发布成功',
      data: newPet
    });
  } catch (error) {
    console.error("发布宠物失败:", error);
    res.status(500).json({
      code: 500,
      message: '发布失败，服务器错误',
      error: error.message
    });
  }
});

// 获取我的发布接口
app.get("/api/pets/my", async (req, res) => {
  try {
    const publisherId = req.headers["x-wx-openid"] || 'mock_user_id';
    
    // 查询我的时，也要把以 accountId 错误保存的数据找回来
    const user = await User.findOne({ where: { openid: publisherId } });
    const queryWhere = {
      publisherId: user ? { [Op.or]: [publisherId, user.accountId] } : publisherId
    };

    const pets = await Pet.findAll({
      where: queryWhere,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      code: 200,
      message: '请求成功',
      data: pets
    });
  } catch (error) {
    console.error("查询我的发布失败:", error);
    res.status(500).json({
      code: 500,
      message: '查询失败，服务器错误',
      error: error.message
    });
  }
});

// 获取单个宠物详情接口
app.get("/api/pets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-wx-openid"] || 'mock_user_id'; // 获取当前用户ID

    const pet = await Pet.findByPk(id, {
      include: [{ model: User }] // 关联查询发布者信息
    });

    if (!pet) {
      return res.status(404).json({
        code: 404,
        message: '未找到该宠物'
      });
    }

    // 查询当前用户是否已收藏该宠物
    const collect = await Collect.findOne({
      where: {
        userId,
        petId: id
      }
    });

    // 返回数据时附带收藏状态
    const petData = pet.toJSON();
    petData.isCollected = !!collect;

    res.json({
      code: 200,
      message: '请求成功',
      data: petData
    });
  } catch (error) {
    console.error("查询宠物详情失败:", error);
    res.status(500).json({
      code: 500,
      message: '查询失败，服务器错误',
      error: error.message
    });
  }
});

// 更新宠物信息 (如状态)
app.put("/api/pets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    // const userId = req.headers["x-wx-openid"] || 'mock_user_id'; // 如果需要验证权限可以在这里加
    
    const pet = await Pet.findByPk(id);
    if (!pet) {
      return res.status(404).json({ code: 404, message: '未找到该宠物' });
    }

    await pet.update(updateData);

    res.json({
      code: 200,
      message: '更新成功',
      data: pet
    });
  } catch (error) {
    console.error("更新宠物失败:", error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 删除单个宠物接口
app.delete("/api/pets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pet = await Pet.findByPk(id);

    if (!pet) {
      return res.status(404).json({
        code: 404,
        message: '未找到该宠物'
      });
    }

    await pet.destroy();
    
    // 同时删除与该宠物相关的收藏记录
    await Collect.destroy({
      where: { petId: id }
    });

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error("删除宠物失败:", error);
    res.status(500).json({
      code: 500,
      message: '删除失败，服务器错误',
      error: error.message
    });
  }
});

// 添加收藏接口
app.post("/api/collects", async (req, res) => {
  try {
    const { petId } = req.body;
    const userId = req.headers["x-wx-openid"] || 'mock_user_id';

    if (!petId) {
      return res.status(400).json({ code: 400, message: 'petId 不能为空' });
    }

    const [collect, created] = await Collect.findOrCreate({
      where: { userId, petId },
      defaults: { userId, petId }
    });

    res.json({
      code: 200,
      message: created ? '收藏成功' : '已经收藏过了',
      data: collect
    });
  } catch (error) {
    console.error("添加收藏失败:", error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 取消收藏接口
app.delete("/api/collects/:petId", async (req, res) => {
  try {
    const { petId } = req.params;
    const userId = req.headers["x-wx-openid"] || 'mock_user_id';

    await Collect.destroy({
      where: { userId, petId }
    });

    res.json({
      code: 200,
      message: '取消收藏成功'
    });
  } catch (error) {
    console.error("取消收藏失败:", error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 获取我的收藏列表接口
app.get("/api/collects/my", async (req, res) => {
  try {
    const userId = req.headers["x-wx-openid"] || 'mock_user_id';

    const collects = await Collect.findAll({
      where: { userId },
      include: [{ model: Pet }] // 关联查询出宠物详情
    });

    // 格式化返回数据，只返回宠物信息数组
    const pets = collects.map(c => c.Pet);

    res.json({
      code: 200,
      message: '获取收藏列表成功',
      data: pets
    });
  } catch (error) {
    console.error("获取收藏列表失败:", error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

const port = process.env.PORT || 80;

async function bootstrap() {
  await initDB();
  
  // 清理之前插入的假宠物数据
  try {
    await Pet.destroy({
      where: {
        nickname: ['小花', '旺财']
      }
    });
  } catch (err) {
    console.error('清理假数据失败', err);
  }

  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
