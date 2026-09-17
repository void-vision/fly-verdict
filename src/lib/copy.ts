import type { Lang, StageKey, Verdict, VerdictKind } from "./types";

type Panel = { kicker: string; title: string; body: string; foot: string; eye: string };
type Step = { num: string; tag: string; h3a: string; h3b: string; p: string; foot: string };
type Card = { kind: VerdictKind; code: string; headline: string; line: string; metricKey: string; metricVal: string };

type Copy = {
  langToggle: string;
  hero: {
    h1a: string;
    h1b: string;
    submark: string;
    lede: string;
    cta: string;
    truthLink: string;
    privacy: string;
    cloudNote: string;
    footLeft: string;
  };
  how: { h2a: string; h2b: string; intro: string; steps: [Step, Step, Step] };
  stage: {
    h2: string;
    labels: Record<StageKey, string>;
    titles: Record<VerdictKind, string>;
    panels: Record<Exclude<StageKey, "result">, Panel> & { result: Omit<Panel, "title"> };
    approach: string;
    escape: string;
    buttons: {
      camera: string;
      upload: string;
      allow: string;
      uploadInstead: string;
      cancel: string;
      capture: string;
      closeCam: string;
      retry: string;
      pickFace: (n: number) => string;
      abort: string;
      replay: string;
      share: string;
      reset: string;
    };
  };
  share: { h2: string; note1: string; note2: string; cards: Card[] };
  truth: { h2: string; p1: string; p2: string; notes: { k: string; v: string }[] };
  footer: { company: string; source: string };
  verdicts: Record<VerdictKind, ((latencyMs: number) => string)[]>;
};

const STAGE_CODES: Record<StageKey, string> = {
  empty: "01",
  permission: "02",
  loading: "03",
  live: "03b",
  noface: "04",
  multiface: "05",
  scanning: "06",
  result: "07",
};

const ZH: Copy = {
  langToggle: "EN",
  hero: {
    h1a: "今天由一只果蝇",
    h1b: "审判你的脸",
    submark: "FLY VERDICT · 蝇审 · 一审终审",
    lede: "你的脸会被压成 817 个六边形光点，喂给一个参考 MaleCNS 视觉通路搭出来的迷你果蝇脑。它不看五官，不懂美丑，只关心一件事：你是不是一只正在扑过来的巨型怪物。",
    cta: "把脸交给果蝇 →",
    truthLink: "这靠谱吗？",
    privacy: "你的脸只在这个标签页里受审。没有服务器，一个字节都不上传，果蝇也不发朋友圈。",
    cloudNote: "图中点云为果蝇体态的程序化近似；复眼、翅与神经系统按真实结构分区着色，非逐神经元解剖坐标。",
    footLeft: "↓ 继续往下，钻进果蝇的脑子",
  },
  how: {
    h2a: "果蝇眼里的你",
    h2b: "约等于马赛克",
    intro: "三步，全部发生在你的浏览器里。每一步都对应果蝇视觉系统里真实存在的结构，只是被我们简化到能塞进一个网页。",
    steps: [
      {
        num: "01 / 复眼",
        tag: "COMPOUND EYE",
        h3a: "800 个小眼，",
        h3b: "每个只汇报一个亮度",
        p: "你修了半小时的图，在这里会被压成 817 个明暗读数。美颜、滤镜、神态管理，全部作废。",
        foot: "ommatidia ≈ 800 · R1–R8 photoreceptors · 每眼",
      },
      {
        num: "02 / 神经元",
        tag: "LPLC2",
        h3a: "77 个神经元",
        h3b: "只盯着越变越大的黑影",
        p: "LPLC2 专门检测「有东西正在逼近」。在它看来，你的脸、一只鸟、一只拖鞋，本质上是同一种东西。",
        foot: "LPLC2 · n=77 · looming detection",
      },
      {
        num: "03 / 反射",
        tag: "DNp09",
        h3a: "逃，还是不逃",
        h3b: "两条回路当场吵架",
        p: "逃跑回路和转向靠近回路同时收到消息。谁放电更猛，谁就拿到这六条腿的控制权。",
        foot: "escape latency ≈ 212 ms · descending neurons",
      },
    ],
  },
  stage: {
    h2: "请被告露脸",
    labels: {
      empty: "候审",
      permission: "请求入庭",
      loading: "法官起床中",
      live: "当庭对视",
      noface: "被告缺席",
      multiface: "共同被告",
      scanning: "审理中",
      result: "宣判",
    },
    titles: { escape: "它跑了", approach: "它朝你走来", hesitate: "它宕机了" },
    panels: {
      empty: {
        kicker: "STATE 01 · IDLE",
        title: "法官已就位，被告未到庭",
        body: "817 个小眼正在缓慢呼吸，它还不知道你在这里。打开摄像头，或者直接把一张照片扔进来。",
        foot: "照片不会离开你的设备。没有服务器，一个字节都不上传。",
        eye: "standby · ommatidia breathing 0.8 Hz",
      },
      permission: {
        kicker: "STATE 02 · PERMISSION",
        title: "借用一下你的摄像头",
        body: "浏览器马上会弹窗问你。画面只留在这个标签页里：不录、不传、不存，果蝇看完就忘。也可以直接把照片拖进取景器。",
        foot: "拖拽区域：JPG / PNG / WEBP / HEIC，最大 12MB，本地读取。",
        eye: "awaiting getUserMedia() · local only",
      },
      live: {
        kicker: "STATE 03B · LIVE",
        title: "它正在盯着你",
        body: "请保持镇定，不要做出扑过来的动作。对好脸，拍一帧交给法庭。你随时可以关掉摄像头。",
        foot: "getUserMedia · local only · 拍摄后才会开庭",
        eye: "live preview · 817 ommatidia",
      },
      loading: {
        kicker: "STATE 03 · LOADING",
        title: "正在叫醒果蝇",
        body: "468 点人脸模型和一颗简化的果蝇视叶正在装进这个标签页。第一次大约 10MB，之后可以离线开庭。一只真实果蝇从卵长到成虫要九天，你只需要等几秒。",
        foot: "参考 MaleCNS 视觉通路 · 可离线缓存 · 照片不出设备",
        eye: "circuit loading · visual pathway",
      },
      noface: {
        kicker: "STATE 04 · NO FACE",
        title: "被告缺席",
        body: "取景器里只有背景。果蝇的逼近检测神经元需要一个正在放大的轮廓，请让脸占满框线，不要躲。",
        foot: "detector: local MediaPipe Face Landmarker · 468 points · 0 faces",
        eye: "0 faces detected",
      },
      multiface: {
        kicker: "STATE 05 · MULTIPLE FACES",
        title: "画面里不止一张脸",
        body: "本庭一次只审一位。点选要送审的那张脸，其他人请到庭外等候，或者退后一点重拍。",
        foot: "detector: local MediaPipe Face Landmarker · 选择其中一张",
        eye: "multiple faces detected · pick one",
      },
      scanning: {
        kicker: "STATE 06 · SCANNING",
        title: "正在把你降维成马赛克",
        body: "画面被压成六边形光点，沿视叶 → 逼近检测神经元 → 下行神经元一层层点亮。审理期间请勿贿赂法官。",
        foot: "spike train recording · window 200 ms · seeded Poisson",
        eye: "downsampling → 817 units · signal propagating",
      },
      result: {
        kicker: "STATE 07 · VERDICT",
        body: "读数来自逃跑回路和转向回路在同一个 200 毫秒里的放电强度，指针落点就是两者之差。本判决不代表人类审美。",
        foot: "这不是颜值打分。被审判的其实是果蝇。",
        eye: "verdict locked · replay available",
      },
    },
    approach: "← 靠近 APPROACH",
    escape: "ESCAPE 逃跑 →",
    buttons: {
      camera: "开启摄像头",
      upload: "上传照片",
      allow: "允许并继续",
      uploadInstead: "改为上传照片",
      cancel: "取消",
      capture: "就这一帧，交给法官",
      closeCam: "关掉摄像头",
      retry: "再露一次脸",
      pickFace: (n) => `审第 ${n} 位被告`,
      abort: "休庭",
      replay: "再审一次",
      share: "下载判决书",
      reset: "换个被告",
    },
  },
  share: {
    h2: "判决书 · 只有三种结局",
    note1: "1080 × 1920 · 竖版",
    note2: "仅含马赛克化头像，不含原图",
    cards: [
      {
        kind: "approach",
        code: "APPROACH",
        headline: "它朝你走来 · APPROACH",
        line: "它朝你转过身来了。在果蝇的世界里，这几乎算一见钟情。",
        metricKey: "DNa02 turning",
        metricVal: "88 spikes/200ms",
      },
      {
        kind: "hesitate",
        code: "HESITATE",
        headline: "它宕机了 · HESITATE",
        line: "它犹豫了。77 个逼近检测神经元集体投了弃权票。",
        metricKey: "LPLC2 looming",
        metricVal: "77 spikes/200ms",
      },
      {
        kind: "escape",
        code: "ESCAPE",
        headline: "它跑了 · ESCAPE",
        line: "逃跑反射触发，用时 212ms。别往心里去，它对你的咖啡杯也这样。",
        metricKey: "escape latency",
        metricVal: "212 ms",
      },
    ],
  },
  truth: {
    h2: "这靠谱吗",
    p1: "接线图是真的，审判是玩的。2026 年 HHMI Janelia 与 Google Research 公布了 MaleCNS，雄性果蝇中枢神经系统的完整接线图：166,691 个神经元，约 1.25 亿个突触。本站没有直接加载这份数据，而是参考其中视觉通路的细胞类型和层级顺序，在你的浏览器里按规则生成了一个高度简化的回路来仿真。",
    p2: "复眼取景、逼近检测、下行通路的层级参考真实解剖，但具体连接和权重是程序生成并手工调参的，不是从连接组逐条读出；放电强度是简化模型的输出，不是实验记录。点云形态为程序化近似。仿真只跑约 2.9 万个单元、10 万条连接，不是 16 万个神经元全脑。",
    notes: [
      {
        k: "诚实声明 / DISCLAIMER",
        v: "果蝇的视力大约相当于 800 像素，而且它完全不理解人类的审美。它对一片吐司也可能想逃跑。",
      },
      {
        k: "被评价的是谁",
        v: "这不是颜值打分。这里没有分数、没有百分比、没有排行榜。我们测量的是一只果蝇的反射，不是你的脸。",
      },
      {
        k: "你的数据",
        v: "摄像头画面与照片全程只存在于当前页面的内存里。仿真、人脸检测、马赛克化都在本地完成。关掉标签页，一切消失，果蝇也不会记得你。",
      },
    ],
  },
  footer: { company: "出品 / VOID VISION", source: "开源 / SOURCE" },
  verdicts: {
    escape: [
      (ms) => `逃跑反射触发，用时 ${ms}ms。别往心里去，它对一片吐司也这样。`,
      (ms) => `${ms}ms 后它就不在了。不是你的问题，是你在它眼里太大了。`,
      (ms) => `判决：立即起飞，用时 ${ms}ms。它对拖鞋、报纸和你一视同仁。`,
    ],
    approach: [
      () => "它朝你转过身来了。在果蝇的世界里，这几乎算一见钟情。",
      () => "转向回路胜诉。恭喜，你在一只果蝇眼里不像拖鞋。",
      () => "它决定过来看看你。大概率是把你当成了一块熟透的水果。",
    ],
    hesitate: [
      () => "它犹豫了。77 个逼近检测神经元集体投了弃权票。",
      () => "逃跑和靠近打成平手，法官当场宕机，申请延期宣判。",
      () => "它盯着你看了很久，最后什么也没做。这可能是果蝇能给出的最高尊重。",
    ],
  },
};

const EN: Copy = {
  langToggle: "中文",
  hero: {
    h1a: "Today, a fruit fly",
    h1b: "judges your face.",
    submark: "FLY VERDICT · 蝇审 · NO APPEALS",
    lede: "Your face gets crushed into 817 hexagonal dots and fed to a tiny fly brain modeled on the MaleCNS visual pathway. It doesn't see features. It has no taste. It only wants to know one thing: are you a giant monster about to lunge at it?",
    cta: "Hand your face to the fly →",
    truthLink: "Is this legit?",
    privacy: "Your face is judged inside this tab only. No server, not a single byte uploaded. The fly doesn't have Instagram either.",
    cloudNote: "The point cloud is a procedural approximation of a fly's body. Eyes, wings and nervous system are colored by real anatomical regions, not per-neuron coordinates.",
    footLeft: "↓ Keep scrolling, straight into the fly's head",
  },
  how: {
    h2a: "You, to a fly,",
    h2b: "are basically a mosaic",
    intro: "Three steps, all inside your browser. Each maps to a structure that really exists in the fly's visual system, simplified enough to fit in a web page.",
    steps: [
      {
        num: "01 / EYE",
        tag: "COMPOUND EYE",
        h3a: "800 tiny eyes,",
        h3b: "each reporting one brightness",
        p: "That photo you spent half an hour editing becomes 817 light-and-dark readings. Filters, angles, your good side: all void.",
        foot: "ommatidia ≈ 800 · R1–R8 photoreceptors · per eye",
      },
      {
        num: "02 / NEURONS",
        tag: "LPLC2",
        h3a: "77 neurons,",
        h3b: "watching for a growing shadow",
        p: "LPLC2 detects exactly one thing: something is closing in. To it, your face, a bird and a slipper are fundamentally the same object.",
        foot: "LPLC2 · n=77 · looming detection",
      },
      {
        num: "03 / REFLEX",
        tag: "DNp09",
        h3a: "Flee or don't flee:",
        h3b: "two circuits pick a fight",
        p: "The escape circuit and the approach circuit get the news at the same time. Whoever fires harder takes control of all six legs.",
        foot: "escape latency ≈ 212 ms · descending neurons",
      },
    ],
  },
  stage: {
    h2: "Defendant, show your face",
    labels: {
      empty: "awaiting trial",
      permission: "requesting entry",
      loading: "judge waking up",
      live: "staring contest",
      noface: "defendant absent",
      multiface: "co-defendants",
      scanning: "in session",
      result: "verdict",
    },
    titles: { escape: "It fled", approach: "It's coming your way", hesitate: "It crashed" },
    panels: {
      empty: {
        kicker: "STATE 01 · IDLE",
        title: "The judge is seated. The defendant is not.",
        body: "817 tiny eyes are breathing slowly. It doesn't know you're here yet. Turn on your camera, or just toss a photo in.",
        foot: "Your photo never leaves your device. No server, not a single byte uploaded.",
        eye: "standby · ommatidia breathing 0.8 Hz",
      },
      permission: {
        kicker: "STATE 02 · PERMISSION",
        title: "Mind if we borrow your camera?",
        body: "Your browser is about to ask. The feed stays in this tab: not recorded, not uploaded, not stored. The fly forgets you the moment it's done. You can also drag a photo into the viewfinder.",
        foot: "Drop zone: JPG / PNG / WEBP / HEIC, max 12MB, read locally.",
        eye: "awaiting getUserMedia() · local only",
      },
      live: {
        kicker: "STATE 03B · LIVE",
        title: "It's staring at you",
        body: "Stay calm. No sudden lunging. Line up your face and hand one frame to the court. You can turn the camera off anytime.",
        foot: "getUserMedia · local only · court opens after capture",
        eye: "live preview · 817 ommatidia",
      },
      loading: {
        kicker: "STATE 03 · LOADING",
        title: "Waking the fly",
        body: "A 468-point face model and a simplified fly optic lobe are loading into this tab. About 10MB the first time, then court can sit offline. A real fruit fly takes nine days to grow from egg to adult. You only have to wait a few seconds.",
        foot: "modeled on MaleCNS visual pathway · offline cache · photo stays on device",
        eye: "circuit loading · visual pathway",
      },
      noface: {
        kicker: "STATE 04 · NO FACE",
        title: "Defendant absent",
        body: "There's only background in the viewfinder. The fly's looming detectors need a growing outline, so fill the frame with your face. No hiding.",
        foot: "detector: local MediaPipe Face Landmarker · 468 points · 0 faces",
        eye: "0 faces detected",
      },
      multiface: {
        kicker: "STATE 05 · MULTIPLE FACES",
        title: "More than one face in frame",
        body: "This court tries one defendant at a time. Pick the face to put on trial. Everyone else, please wait outside, or step back and retake.",
        foot: "detector: local MediaPipe Face Landmarker · pick one",
        eye: "multiple faces detected · pick one",
      },
      scanning: {
        kicker: "STATE 06 · SCANNING",
        title: "Downsampling you into a mosaic",
        body: "Your image is crushed into hexagonal dots that light up layer by layer: optic lobe → looming detectors → descending neurons. Please do not bribe the judge during proceedings.",
        foot: "spike train recording · window 200 ms · seeded Poisson",
        eye: "downsampling → 817 units · signal propagating",
      },
      result: {
        kicker: "STATE 07 · VERDICT",
        body: "The reading comes from how hard the escape and turning circuits fire in the same 200 ms window. The needle marks the difference. This verdict does not reflect human beauty standards.",
        foot: "This is not a looks rating. The fly is the one being tested.",
        eye: "verdict locked · replay available",
      },
    },
    approach: "← APPROACH",
    escape: "ESCAPE →",
    buttons: {
      camera: "Turn on camera",
      upload: "Upload a photo",
      allow: "Allow and continue",
      uploadInstead: "Upload a photo instead",
      cancel: "Cancel",
      capture: "This frame. Give it to the judge.",
      closeCam: "Turn off camera",
      retry: "Show your face again",
      pickFace: (n) => `Try defendant #${n}`,
      abort: "Adjourn",
      replay: "Retry the case",
      share: "Download the verdict",
      reset: "Next defendant",
    },
  },
  share: {
    h2: "The verdict · three possible endings",
    note1: "1080 × 1920 · portrait",
    note2: "mosaic avatar only, never the original photo",
    cards: [
      {
        kind: "approach",
        code: "APPROACH",
        headline: "COMING YOUR WAY · APPROACH",
        line: "It turned toward you. In fruit fly terms, that's basically love at first sight.",
        metricKey: "DNa02 turning",
        metricVal: "88 spikes/200ms",
      },
      {
        kind: "hesitate",
        code: "HESITATE",
        headline: "IT CRASHED · HESITATE",
        line: "It hesitated. All 77 looming detectors abstained.",
        metricKey: "LPLC2 looming",
        metricVal: "77 spikes/200ms",
      },
      {
        kind: "escape",
        code: "ESCAPE",
        headline: "IT FLED · ESCAPE",
        line: "Escape reflex fired in 212ms. Don't take it personally, it does this to your coffee mug too.",
        metricKey: "escape latency",
        metricVal: "212 ms",
      },
    ],
  },
  truth: {
    h2: "Is this legit?",
    p1: "The wiring diagram is real; the trial is for fun. In 2026, HHMI Janelia and Google Research released MaleCNS, the complete wiring diagram of the male fruit fly's central nervous system: 166,691 neurons and roughly 125 million synapses. This site doesn't load that dataset directly. It borrows the cell types and layer order of the visual pathway and generates a heavily simplified circuit, by rule, right in your browser.",
    p2: "Eye sampling, looming detection and the descending pathway follow real anatomy, but the actual connections and weights are procedurally generated and hand-tuned, not read edge by edge from the connectome. Spike counts come from a simplified model, not experimental recordings. The point cloud is a procedural approximation. The simulation runs about 29,000 units and 100,000 connections, not the full 166,000-neuron brain.",
    notes: [
      {
        k: "HONEST DISCLAIMER",
        v: "A fruit fly sees at roughly 800 pixels and has zero understanding of human beauty. It might want to flee from a slice of toast, too.",
      },
      {
        k: "WHO IS BEING JUDGED",
        v: "This is not a looks rating. No scores, no percentages, no leaderboard. We measure a fly's reflex, not your face.",
      },
      {
        k: "YOUR DATA",
        v: "Camera frames and photos live only in this page's memory. Simulation, face detection and mosaicking all run locally. Close the tab and everything is gone. The fly won't remember you either.",
      },
    ],
  },
  footer: { company: "BY VOID VISION", source: "SOURCE" },
  verdicts: {
    escape: [
      (ms) => `Escape reflex fired in ${ms}ms. Don't take it personally, it does this to toast.`,
      (ms) => `Gone in ${ms}ms. It's not you. You're just enormous from where it's standing.`,
      (ms) => `Verdict: immediate takeoff, ${ms}ms. Slippers, newspapers and you are treated equally.`,
    ],
    approach: [
      () => "It turned toward you. In fruit fly terms, that's basically love at first sight.",
      () => "The turning circuit wins the case. Congratulations, to a fruit fly you do not look like a slipper.",
      () => "It wants a closer look. Odds are it thinks you're a very ripe piece of fruit.",
    ],
    hesitate: [
      () => "It hesitated. All 77 looming detectors abstained.",
      () => "Flee and approach tied. The judge crashed and requested a postponement.",
      () => "It stared at you for a long time, then did nothing. That may be the highest respect a fruit fly can give.",
    ],
  },
};

export const COPY: Record<Lang, Copy> = { zh: ZH, en: EN };

export function stageMeta(lang: Lang, sk: StageKey) {
  return { code: STAGE_CODES[sk], label: COPY[lang].stage.labels[sk] };
}

export function panelCopy(lang: Lang, sk: StageKey, kind: VerdictKind): Panel {
  const stage = COPY[lang].stage;
  return sk === "result" ? { ...stage.panels.result, title: stage.titles[kind] } : stage.panels[sk];
}

export function verdictLine(lang: Lang, verdict: Verdict): string {
  const lines = COPY[lang].verdicts[verdict.kind];
  return lines[verdict.lineIndex % lines.length]!(verdict.readout.latencyMs);
}
