const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { init: initDB, Counter } = require("./db");

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

// 获取宠物列表数据（模拟真实数据库返回）
app.get("/api/pets", (req, res) => {
  res.json({
    code: 200,
    message: '请求成功',
    data: [
      {
        id: '1',
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
        id: '2',
        url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        nickname: '旺财',
        breed: '金毛',
        age: '1岁',
        gender: 'male',
        location: '四川省成都市武侯区天府大道1号',
        tags: ['看家护院', '忠诚'],
        status: '寻找中'
      },
      {
        id: '3',
        url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        nickname: '豆豆',
        breed: '哈士奇',
        age: '2岁',
        gender: 'male',
        location: '四川省成都市武侯区高新西区',
        tags: ['温顺'],
        status: '寻找中'
      },
      {
        id: '4',
        url: 'https://images.unsplash.com/photo-1529429617124-95b109e86bb8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        nickname: '小白',
        breed: '萨摩耶',
        age: '1岁',
        gender: 'female',
        location: '四川省成都市武侯区高新南区',
        tags: ['会定点', '亲人'],
        status: '寻找中'
      }
    ]
  });
});

const port = process.env.PORT || 80;

async function bootstrap() {
  await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
