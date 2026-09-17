import type { StageKey, VerdictKind } from "./types";

export const STATE_DEFS: { key: StageKey; code: string; label: string }[] = [
  { key: "empty", code: "01", label: "空状态" },
  { key: "permission", code: "02", label: "授权 / 上传" },
  { key: "loading", code: "03", label: "加载中" },
  { key: "live", code: "03b", label: "取景中" },
  { key: "noface", code: "04", label: "未检测到人脸" },
  { key: "multiface", code: "05", label: "多张人脸" },
  { key: "scanning", code: "06", label: "扫描中" },
  { key: "result", code: "07", label: "结果" },
];

export function panelCopy(
  sk: StageKey,
  kind: VerdictKind,
): {
  kicker: string;
  title: string;
  body: string;
  foot: string;
  eye: string;
} {
  const titles: Record<VerdictKind, string> = {
    escape: "它想逃跑",
    approach: "它想靠近你",
    hesitate: "它没有决定",
  };
  const T = {
    empty: {
      kicker: "STATE 01 · IDLE",
      title: "取景器待机中",
      body: "817 个小眼正在缓慢呼吸。它还不知道你在这里。开启摄像头，或拖一张照片进来。",
      foot: "照片不会离开你的设备。没有服务器，一个字节都不上传。",
      eye: "standby · ommatidia breathing 0.8 Hz",
    },
    permission: {
      kicker: "STATE 02 · PERMISSION",
      title: "需要你的摄像头",
      body: "浏览器会弹出授权请求。画面只会留在这个标签页里，不会被记录、上传或存储。也可以直接把照片拖进取景器。",
      foot: "拖拽区域：JPG / PNG / WEBP / HEIC，最大 12MB，本地读取。",
      eye: "awaiting getUserMedia() · local only",
    },
    live: {
      kicker: "STATE 03B · LIVE",
      title: "复眼已经对准你",
      body: "画面只在这个标签页里。对好脸，拍一帧送进视叶。你随时可以关掉摄像头。",
      foot: "getUserMedia · local only · 拍摄后才会跑仿真",
      eye: "live preview · 817 ommatidia",
    },
    loading: {
      kicker: "STATE 03 · LOADING",
      title: "正在唤醒苍蝇",
      body: "468 点人脸模型和视叶到下行神经元的接线表正在装入这个标签页。第一次大约 10MB，之后可以离线。一只真实果蝇孵化成虫需要九天。",
      foot: "MaleCNS 视觉通路子网络 · 可离线缓存 · 照片不出设备",
      eye: "connectome streaming · visual pathway",
    },
    noface: {
      kicker: "STATE 04 · NO FACE",
      title: "没看到脸",
      body: "取景器里只有背景。苍蝇的逼近检测神经元需要一个正在放大的轮廓——请让脸占满框线内的区域。",
      foot: "detector: local MediaPipe Face Landmarker · 468 points · 0 faces",
      eye: "0 faces detected",
    },
    multiface: {
      kicker: "STATE 05 · MULTIPLE FACES",
      title: "画面里有两张脸",
      body: "一次只审一个人。点选你要送进复眼的那一张，或者退后一点重拍。",
      foot: "detector: local MediaPipe Face Landmarker · 选择其中一张",
      eye: "multiple faces detected · pick one",
    },
    scanning: {
      kicker: "STATE 06 · SCANNING",
      title: "正在降采样你的脸",
      body: "画面被压成六边形马赛克，光点离开复眼，沿视叶 → 逼近检测神经元 → 下行神经元一层层点亮。",
      foot: "spike train recording · window 200 ms · seeded Poisson",
      eye: "downsampling → 817 units · signal propagating",
    },
    result: {
      kicker: "STATE 07 · VERDICT",
      title: titles[kind],
      body: "读数来自逃逸回路与转向靠近回路在同一个 200 毫秒窗口里的放电强度。指针落点就是两者之差。",
      foot: "这不是颜值打分。被评价的是苍蝇。",
      eye: "verdict locked · replay available",
    },
  };
  return T[sk];
}

export const SHARE_CARDS: {
  kind: VerdictKind;
  code: string;
  headline: string;
  line: string;
  metricKey: string;
  metricVal: string;
}[] = [
  {
    kind: "approach",
    code: "APPROACH",
    headline: "它想靠近你 · APPROACH",
    line: "它朝你转了 14°。在果蝇的世界里，这几乎算一见钟情。",
    metricKey: "DNa02 turning",
    metricVal: "88 spikes/200ms",
  },
  {
    kind: "hesitate",
    code: "HESITATE",
    headline: "它没有决定 · HESITATE",
    line: "它犹豫了。77 个逼近检测神经元投了弃权票。",
    metricKey: "LPLC2 looming",
    metricVal: "77 spikes/200ms",
  },
  {
    kind: "escape",
    code: "ESCAPE",
    headline: "它想逃跑 · ESCAPE",
    line: "逃逸反射触发，用时 212ms。别往心里去，它对你的咖啡杯也这样。",
    metricKey: "escape latency",
    metricVal: "212 ms",
  },
];
