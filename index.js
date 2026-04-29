const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { init: initDB, Counter, Pet } = require("./db");

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

// 获取宠物列表数据（从真实 MySQL 数据库查询）
app.get("/api/pets", async (req, res) => {
  try {
    const pets = await Pet.findAll({
      order: [['createdAt', 'DESC']] // 按最新发布排序
    });
    
    // 如果数据库里一条数据都没有，自动插入几条测试数据以便我们看到效果
    if (pets.length === 0) {
      const mockData = [
        {
          url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
          nickname: '小花',
          breed: '中华田园猫',
          age: '3个月',
          gender: 'female',
          location: '四川省成都市武侯区人民南路',
          tags: ['活泼好动', '亲人'],
          status: '寻找中'
        },
        {
          url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
          nickname: '旺财',
          breed: '金毛',
          age: '1岁',
          gender: 'male',
          location: '四川省成都市武侯区天府大道1号',
          tags: ['看家护院', '忠诚'],
          status: '寻找中'
        }
      ];
      await Pet.bulkCreate(mockData);
      const newPets = await Pet.findAll({ order: [['createdAt', 'DESC']] });
      return res.json({
        code: 200,
        message: '请求成功 (新初始化的数据)',
        data: newPets
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
    const { url, nickname, breed, age, gender, location, tags, status, desc } = req.body;
    
    // 简单的参数校验
    if (!nickname || !breed || !age) {
      return res.status(400).json({
        code: 400,
        message: '昵称、品种、年龄为必填项'
      });
    }

    // 在数据库中创建新宠物记录
    const newPet = await Pet.create({
      url: url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', // 默认图片
      nickname,
      breed,
      age,
      gender: gender || 'unknown',
      location: location || '未知位置',
      tags: tags || [],
      status: status || '寻找中',
      desc: desc || ''
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

// 获取单个宠物详情接口
app.get("/api/pets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pet = await Pet.findByPk(id);

    if (!pet) {
      return res.status(404).json({
        code: 404,
        message: '未找到该宠物'
      });
    }

    res.json({
      code: 200,
      message: '请求成功',
      data: pet
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

const port = process.env.PORT || 80;

async function bootstrap() {
  await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
