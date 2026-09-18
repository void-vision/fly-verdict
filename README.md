# 蝇审 / FLY VERDICT

果蝇颜值鉴定：让一只果蝇的大脑给你的脸打分。「蝇审」取「果蝇审美」之意。

网页从你的脸上取 478 个关键点，按五官的对称和比例给出一个**果蝇眼中的颜值分**（40–99）和段位称号；同时把脸压成果蝇复眼看到的 817 个六边形亮度读数，送进一个按 MaleCNS 连接组视觉通路简化出来的脉冲神经网络，得出果蝇的反应：它想**靠近**你、看呆了，还是想**逃跑**。

分数全部按瞳距换算，远近、光线和肤色都不影响；歪头或侧脸会算作不对称。同一张脸在不同距离、亮度下重拍，分数波动约 ±4 分。分数曲线故意偏宽容，平均约 74 分，最低 40 分。没有排行榜，分数也不出设备。

> **隐私**：全部计算都在浏览器里完成。没有后端，照片和摄像头画面不会上传，也不会被存储。

---

## 它是怎么工作的

```
摄像头 / 上传照片
  → MediaPipe Face Landmarker（本地 WASM，478 个关键点）
  → 按双眼连线旋转、缩放、裁剪成 256×256 的对齐人脸
  → 采样成 817 个六边形小眼的亮度（16 圈六边形网格）
  → 亮度 → 光感受器泊松放电率
  → LIF 脉冲神经网络，200 ms 窗口，步长 0.5 ms（Web Worker）
  → 读出 LPLC2 / Giant Fiber / DNp09（逃跑）与 DNa02（转向靠近）
  → 颜值分 40–99（来自关键点几何）+ 反应：APPROACH · HESITATE · ESCAPE
```

| 环节 | 实现 |
| --- | --- |
| 复眼采样 | `src/lib/ommatidia.ts` — 817 个小眼，球面投影的六边形网格 |
| 人脸对齐 | `src/lib/normalize.ts` — 以虹膜中心为基准，固定瞳距 |
| 视觉通路 | `src/lib/circuit.ts` — 光感受器 → 视神经板层（L1–L3）→ 髓质（Mi / Tm）→ T4/T5 → 小叶（LC）→ 77 个 LPLC2 → GF → DNp09，另有 DNa02 左右两支 |
| 连接组编码 | `src/lib/connectome-codec.ts` — 按突触后神经元的 CSR，LEB128 差分 + 符号位图 + 8 位权重 |
| 仿真 | `src/lib/lif.ts` — 漏积分发放神经元，随机数种子取自小眼亮度的 SHA-256 |
| 反应 | `src/lib/verdict.ts` — 逃跑驱动与靠近驱动之差归一化，差值绝对值 < 0.12 判为犹豫 |
| 颜值分 | `src/lib/face-geometry.mjs` — 478 个关键点按瞳距归一化、眼线摆平后，算左右对称度与三项五官比例（内眼距/眼宽、嘴宽/瞳距、下庭/中庭），logistic 校准到 40–99（偏宽容，均值约 74）。不用神经回路打分：脉冲仿真对输入太敏感，同一张脸挪几厘米分数就乱跳 |

生成的 `public/connectome.bin` 约 312 KB，包含 28,676 个神经元、105,086 个突触。

**结果是确定性的**：同一张对齐后的人脸永远得到同一个反应和同一个分数。`npm run check:sim` 会在构建时验证这一点。

---

## 快速开始

需要 Node.js 20+。

```bash
npm install        # postinstall 会把 MediaPipe wasm 复制到 public/mediapipe/wasm
npm run connectome # 生成 public/connectome.bin
npm run dev        # 先打包 worker，再启动 next dev
```

打开 <http://localhost:3000>。

摄像头只能在 `localhost` 或 HTTPS 下使用；用局域网 IP 在手机上调试时，请改用上传照片，或者配置 HTTPS。

### 脚本

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 打包 worker 并启动开发服务器 |
| `npm run build` | 生成连接组 → 打包 worker → 校验仿真 → `next build` |
| `npm run start` | 运行生产构建 |
| `npm run lint` | ESLint |
| `npm run connectome` | 生成 `public/connectome.bin` |
| `npm run worker` | 用 esbuild 把 `src/workers/brain.worker.ts` 打包成 `public/brain.worker.js` |
| `npm run check:sim` | 解码连接组，校验神经元数、确定性，以及明暗输入能区分开 |

---

## 目录结构

```
src/
  app/            App Router 入口、全局样式、字体
  components/     页面各区块：Stage（取景器与出分）、HowItSees、ShareCards、Truth
  hooks/          useFlySession（摄像头 → 检测 → 仿真的状态机）、useTheme、useMedia
  lib/            复眼、对齐、通路、编解码、LIF、反应与颜值分、分享卡
  lib/viz/        首屏点云与六边形复眼的 Canvas 绘制
  workers/        仿真 Web Worker
scripts/
  visual-pathway.mjs    构建期使用的通路 / 编解码 / LIF（与 src/lib 的 TS 实现保持一致）
  build-connectome.mjs  写出 connectome.bin
  build-worker.mjs      打包 worker
  check-sim.mjs         构建期校验
  vendor-mediapipe.mjs  复制 wasm，缺模型时下载 face_landmarker.task
public/
  sw.js                 Service Worker：缓存应用外壳、模型和连接组，支持离线
  mediapipe/            face_landmarker.task（入库）与 wasm（安装时生成）
raw/                    设计稿
```

> `scripts/visual-pathway.mjs` 与 `src/lib/{circuit,connectome-codec,lif}.ts` 是同一套逻辑的两份实现。修改其中一份时必须同步另一份，否则构建期校验的就不是浏览器里真正运行的代码。

---

## 部署

这是一个纯静态的 App Router 站点，可以直接部署到 Vercel：

```bash
npx vercel
```

- 安装阶段会执行 `postinstall`，复制 MediaPipe wasm。
- `public/mediapipe/face_landmarker.task` 需要提交进仓库。如果文件缺失，`postinstall` 会尝试从 Google Storage 下载。
- `public/mediapipe/wasm` 和 `public/brain.worker.js` 都是生成文件，已加入 `.gitignore`。
- 缓存头写在 `next.config.ts` 里。`connectome.bin` 的文件名不带哈希，所以浏览器每次都会向服务器确认是否有更新。

### 升级模型或连接组时

Service Worker（`public/sw.js`）与 `src/lib/asset-cache.ts` 共用缓存名 `fly-verdict-v4`。只要 `connectome.bin`、MediaPipe 版本或模型文件变了，**两处的缓存名要一起改版本号**，否则老用户会一直用本地缓存的旧文件。

---

## 诚实声明

- 连接组数据来自 **MaleCNS**（HHMI Janelia FlyEM & Google Research，CC-BY）。本站不直接加载原始数据，而是按其视觉通路的细胞类型和拓扑，程序化生成一个视网膜拓扑的简化子网络。
- 在线仿真的是约 2.9 万个单元的视叶 → LPLC2 → 下行神经元子图，不是全部 166,691 个神经元。
- 放电强度是简化模型的输出，不是实验记录。
- 首屏点云是果蝇体态的程序化近似，不是逐个神经元的解剖坐标。
- 果蝇的视力大约只有 800 个"像素"，它也不理解人类的审美。

## 技术栈

Next.js 16（App Router）· React 19 · Tailwind CSS 4 · TypeScript · MediaPipe Tasks Vision 0.10.21 · Web Worker · Service Worker

## 许可

代码使用 [MIT](./LICENSE) 许可。MaleCNS 连接组的署名要求遵循 CC-BY。
