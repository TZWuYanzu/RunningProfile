<p align="center">
  <img width="150" src="https://avatars.githubusercontent.com/TZWuYanzu" style="border-radius: 50%;" />
</p>

<h3 align="center">
  <a href="https://TZWuYanzu.github.io/RunningProfile">诺金的跑野记录</a>
</h3>

<p align="center">
  <a href="https://github.com/TZWuYanzu/RunningProfile/actions"><img src="https://github.com/TZWuYanzu/RunningProfile/actions/workflows/run_data_sync.yml/badge.svg" alt="Github Action"></a>
</p>

> 基于 [yihong0618/running_page](https://github.com/yihong0618/running_page) 构建，使用 COROS 手表同步数据，高德地图展示轨迹。

## 功能特性

- GitHub Actions 自动同步 COROS 运动数据
- 高德地图展示运动轨迹（加载更快，适合国内用户）
- GitHub Pages 自动部署
- React 18 + Vite 4 + TypeScript
- 响应式设计，支持移动端

## 快速开始

### 环境要求

- Node.js >= 20
- Python >= 3.11

### 本地开发

```bash
# 安装依赖
pip3 install -r requirements.txt
npm install -g corepack && corepack enable && pnpm install

# 启动开发服务器
pnpm develop
```

打开浏览器访问 <http://localhost:5173/>

### 配置地图服务

本项目支持**高德地图**和 **Mapbox** 两种地图服务，通过环境变量切换。

创建 `.env.local` 文件：

```bash
# 地图服务选择: mapbox | amap
VITE_MAP_PROVIDER=amap

# 高德地图 Key（如果使用高德地图）
# 获取方式: https://console.amap.com/dev/key/app
# 注意: Key 类型必须选择 “Web端(JS API)”
VITE_AMAP_KEY=your_amap_key

# Mapbox Token（如果使用 Mapbox）
# 获取方式: https://account.mapbox.com/access-tokens/
VITE_MAPBOX_TOKEN=your_mapbox_token
```

### 同步 COROS 数据

```bash
# 本地同步
python run_page/coros_sync.py 'your_coros_account' 'your_coros_password'
```

或通过 `config.yaml` 配置凭证（更安全）：

```yaml
coros:
  account: "your_email"
  password: "your_password"
```

然后执行：

```bash
python run_page/coros_sync.py --config config.yaml
```

## 自定义页面

修改 `src/static/site-metadata.ts`：

```typescript
const data = {
  siteTitle: '诺金的跑野记录',
  siteUrl: 'https://TZWuYanzu.github.io/RunningProfile',
  logo: 'https://avatars.githubusercontent.com/TZWuYanzu',
  description: 'Personal running page',
  navLinks: [
    { name: 'Blog', url: '' },
    { name: 'About', url: '' },
  ],
};
```

修改 `src/utils/const.ts` 样式配置：

```typescript
const IS_CHINESE = true;           // 中文界面
const USE_DASH_LINE = true;        // 虚线路线
const LINE_OPACITY = 0.4;          // 路线透明度
const PRIVACY_MODE = false;        // 隐私模式（只显示路线，不显示地图）
const LIGHTS_ON = true;            // 默认开启地图显示
```

## GitHub Actions 自动同步

### 配置 Secrets

在仓库的 `Settings -> Secrets and variables -> Actions` 中添加：

| Secret 名称 | 说明 |
|---|---|
| `COROS_ACCOUNT` | COROS 账号（邮箱） |
| `COROS_PASSWORD` | COROS 密码 |

### 触发同步

手动触发：`Actions -> Run Data Sync -> Run workflow`

或等待定时任务自动执行。

## 部署

本项目使用 **GitHub Pages** 自动部署。

推送代码到 `develop/1.0` 分支后，GitHub Actions 会自动构建并部署到 GitHub Pages。

## 项目结构

```
├── src/                    # 前端源码
│   ├── components/        # React 组件
│   │   └── RunMap/        # 地图组件（支持高德/Mapbox）
│   ├── static/            # 站点配置
│   └── utils/             # 工具函数和常量
├── run_page/              # Python 数据同步脚本
├── assets/                # SVG 统计图
├── FIT_OUT/               # FIT 文件输出
└── .github/workflows/     # GitHub Actions 工作流
```

## 致谢

- 基于 [yihong0618/running_page](https://github.com/yihong0618/running_page) 构建
- 感谢所有贡献者

## License

MIT
