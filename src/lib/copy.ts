import { flyTier } from "./fly-score.mjs";
import type { Lang, StageKey, Verdict, VerdictKind } from "./types";

type Panel = { kicker: string; title: string; body: string; foot: string; eye: string };
type Step = { num: string; tag: string; h3a: string; h3b: string; p: string; foot: string };
type Tier = { title: string; line: string };
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
  score: { label: string; unit: string };
  /** Highest first; indexed by `flyTier`. */
  tiers: [Tier, Tier, Tier, Tier, Tier];
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
    h1b: "给你的颜值打分",
    submark: "FLY VERDICT · 蝇审 · 果蝇审美",
    lede: "你的脸会被压成 817 个六边形光点，喂给一个参考 MaleCNS 视觉通路搭出来的迷你果蝇脑。它不看五官、不认滤镜，只凭一只果蝇的本能告诉你：你在它眼里值几分。",
    cta: "让果蝇看看我 →",
    truthLink: "这靠谱吗？",
    privacy: "你的脸只在这个标签页里被鉴定。没有服务器，一个字节都不上传，果蝇也不发朋友圈。",
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
        h3a: "心动，还是想逃",
        h3b: "两条回路当场吵架",
        p: "逃跑回路和转向靠近回路同时收到消息。谁放电更猛，谁就决定它对你的第一印象。",
        foot: "escape latency ≈ 212 ms · descending neurons",
      },
    ],
  },
  stage: {
    h2: "请露脸",
    labels: {
      empty: "待鉴定",
      permission: "请求授权",
      loading: "果蝇起床中",
      live: "对视中",
      noface: "没找到脸",
      multiface: "不止一张脸",
      scanning: "鉴定中",
      result: "出分",
    },
    titles: { escape: "它害羞地飞走了", approach: "它朝你飞过来了", hesitate: "它看呆了" },
    panels: {
      empty: {
        kicker: "STATE 01 · IDLE",
        title: "果蝇已就位，等你露脸",
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
        body: "请保持镇定，不要做出扑过来的动作。对好脸，拍一帧给果蝇看。你随时可以关掉摄像头。",
        foot: "getUserMedia · local only · 拍摄后才开始鉴定",
        eye: "live preview · 817 ommatidia",
      },
      loading: {
        kicker: "STATE 03 · LOADING",
        title: "正在叫醒果蝇",
        body: "468 点人脸模型和一颗简化的果蝇视叶正在装进这个标签页。第一次大约 10MB，之后可以离线使用。一只真实果蝇从卵长到成虫要九天，你只需要等几秒。",
        foot: "参考 MaleCNS 视觉通路 · 可离线缓存 · 照片不出设备",
        eye: "circuit loading · visual pathway",
      },
      noface: {
        kicker: "STATE 04 · NO FACE",
        title: "没找到脸",
        body: "取景器里只有背景。果蝇得先看清你的轮廓才能打分，请让脸占满框线，不要躲。",
        foot: "detector: local MediaPipe Face Landmarker · 468 points · 0 faces",
        eye: "0 faces detected",
      },
      multiface: {
        kicker: "STATE 05 · MULTIPLE FACES",
        title: "画面里不止一张脸",
        body: "果蝇一次只看一张脸。点选要鉴定的那张，其他人请稍等，或者退后一点重拍。",
        foot: "detector: local MediaPipe Face Landmarker · 选择其中一张",
        eye: "multiple faces detected · pick one",
      },
      scanning: {
        kicker: "STATE 06 · SCANNING",
        title: "正在把你降维成马赛克",
        body: "画面被压成六边形光点，沿视叶 → 逼近检测神经元 → 下行神经元一层层点亮。鉴定期间请勿贿赂果蝇。",
        foot: "spike train recording · window 200 ms · seeded Poisson",
        eye: "downsampling → 817 units · signal propagating",
      },
      result: {
        kicker: "STATE 07 · SCORE",
        body: "反应来自逃跑回路和转向回路在同一个 200 毫秒里的放电强度，指针落点就是两者之差。颜值分另跑一轮：先抹掉明暗和肤色，只留轮廓，再看它想不想逃。",
        foot: "这是果蝇的审美：817 个像素，不代表任何人类标准。",
        eye: "score locked · replay available",
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
      capture: "就这一帧，给果蝇看",
      closeCam: "关掉摄像头",
      retry: "再露一次脸",
      pickFace: (n) => `鉴定第 ${n} 张脸`,
      abort: "取消鉴定",
      replay: "再测一次",
      share: "下载颜值报告",
      reset: "换张脸",
    },
  },
  share: {
    h2: "颜值报告 · 果蝇的三种反应",
    note1: "1080 × 1920 · 竖版",
    note2: "仅含马赛克化头像，不含原图",
    cards: [
      {
        kind: "approach",
        code: "APPROACH",
        headline: "它朝你飞过来了 · APPROACH",
        line: "它朝你转过身来了。在果蝇的世界里，这几乎算一见钟情。",
        metricKey: "DNa02 turning",
        metricVal: "88 spikes/200ms",
      },
      {
        kind: "hesitate",
        code: "HESITATE",
        headline: "它看呆了 · HESITATE",
        line: "它愣在原地盯着你。77 个逼近检测神经元集体忘了投票。",
        metricKey: "LPLC2 looming",
        metricVal: "77 spikes/200ms",
      },
      {
        kind: "escape",
        code: "ESCAPE",
        headline: "它害羞地飞走了 · ESCAPE",
        line: "212ms 后它就飞走了。据说果蝇见到太好看的东西也会慌。",
        metricKey: "escape latency",
        metricVal: "212 ms",
      },
    ],
  },
  truth: {
    h2: "这靠谱吗",
    p1: "接线图是真的，打分是玩的。2026 年 HHMI Janelia 与 Google Research 公布了 MaleCNS，雄性果蝇中枢神经系统的完整接线图：166,691 个神经元，约 1.25 亿个突触。本站没有直接加载这份数据，而是参考其中视觉通路的细胞类型和层级顺序，在你的浏览器里按规则生成了一个高度简化的回路来仿真。",
    p2: "复眼取景、逼近检测、下行通路的层级参考真实解剖，但具体连接和权重是程序生成并手工调参的，不是从连接组逐条读出；放电强度是简化模型的输出，不是实验记录。点云形态为程序化近似。仿真只跑约 2.9 万个单元、10 万条连接，不是 16 万个神经元全脑。",
    notes: [
      {
        k: "诚实声明 / DISCLAIMER",
        v: "果蝇的视力大约相当于 800 像素，而且它完全不理解人类的审美。它对一片吐司也可能想逃跑。",
      },
      {
        k: "分数怎么来的",
        v: "是的，这里有颜值分，但打分的是一只果蝇。算分前我们会把画面的明暗和对比度拉平，所以肤色和打光不会加分也不会扣分。剩下的差别很小，主要看它那 200 毫秒的心情：同一张照片永远同分，换一张它可能就改主意了，真果蝇也是这样。没有排行榜，分数不出设备。",
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
      (ms) => `${ms}ms 后它就飞走了。据说果蝇见到太好看的东西也会慌。`,
      (ms) => `它只看了你 ${ms}ms 就起飞了。不是你的问题，是你在它眼里太大了。`,
      (ms) => `起飞用时 ${ms}ms。它对拖鞋、报纸和你一视同仁，别往心里去。`,
    ],
    approach: [
      () => "它朝你转过身来了。在果蝇的世界里，这几乎算一见钟情。",
      () => "转向回路胜诉。恭喜，你在一只果蝇眼里不像拖鞋。",
      () => "它决定过来看看你。大概率是把你当成了一块熟透的水果。",
    ],
    hesitate: [
      () => "它愣在原地盯着你。77 个逼近检测神经元集体忘了投票。",
      () => "逃跑和靠近打成平手，它当场看呆了。",
      () => "它盯着你看了很久，最后什么也没做。这可能是果蝇能给出的最高尊重。",
    ],
  },
  score: { label: "果蝇眼中的颜值", unit: "分" },
  tiers: [
    { title: "果蝇界顶流", line: "转向回路疯狂放电，它差点忘了自己是只果蝇。" },
    { title: "复眼里的高光", line: "817 个小眼同时亮了一下，这在果蝇界就算回头率了。" },
    { title: "果蝇心动款", line: "在它眼里，你比一根熟透的香蕉还诱人一点。" },
    { title: "果蝇顺眼", line: "它多看了你两眼。对一只果蝇来说，这已经是认可了。" },
    { title: "耐看型", line: "果蝇只有 800 像素，得多看几眼才能 get 到你。" },
  ],
};

const EN: Copy = {
  langToggle: "中文",
  hero: {
    h1a: "Today, a fruit fly",
    h1b: "rates your looks.",
    submark: "FLY VERDICT · 蝇审 · FLY-GRADE BEAUTY",
    lede: "Your face gets crushed into 817 hexagonal dots and fed to a tiny fly brain modeled on the MaleCNS visual pathway. It ignores features and filters. Running on pure fly instinct, it tells you one thing: how many points you're worth to it.",
    cta: "Let the fly take a look →",
    truthLink: "Is this legit?",
    privacy: "Your face is rated inside this tab only. No server, not a single byte uploaded. The fly doesn't have Instagram either.",
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
        h3a: "Crush or flee:",
        h3b: "two circuits pick a fight",
        p: "The escape circuit and the approach circuit get the news at the same time. Whoever fires harder decides its first impression of you.",
        foot: "escape latency ≈ 212 ms · descending neurons",
      },
    ],
  },
  stage: {
    h2: "Show your face",
    labels: {
      empty: "ready",
      permission: "requesting access",
      loading: "fly waking up",
      live: "staring contest",
      noface: "no face",
      multiface: "multiple faces",
      scanning: "rating",
      result: "score",
    },
    titles: { escape: "It flew off, flustered", approach: "It's flying your way", hesitate: "It froze, staring" },
    panels: {
      empty: {
        kicker: "STATE 01 · IDLE",
        title: "The fly is ready. Are you?",
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
        body: "Stay calm. No sudden lunging. Line up your face and show the fly one frame. You can turn the camera off anytime.",
        foot: "getUserMedia · local only · rating starts after capture",
        eye: "live preview · 817 ommatidia",
      },
      loading: {
        kicker: "STATE 03 · LOADING",
        title: "Waking the fly",
        body: "A 468-point face model and a simplified fly optic lobe are loading into this tab. About 10MB the first time, then it works offline. A real fruit fly takes nine days to grow from egg to adult. You only have to wait a few seconds.",
        foot: "modeled on MaleCNS visual pathway · offline cache · photo stays on device",
        eye: "circuit loading · visual pathway",
      },
      noface: {
        kicker: "STATE 04 · NO FACE",
        title: "No face found",
        body: "There's only background in the viewfinder. The fly needs a clear outline to rate you, so fill the frame with your face. No hiding.",
        foot: "detector: local MediaPipe Face Landmarker · 468 points · 0 faces",
        eye: "0 faces detected",
      },
      multiface: {
        kicker: "STATE 05 · MULTIPLE FACES",
        title: "More than one face in frame",
        body: "The fly rates one face at a time. Pick the one to rate. Everyone else, please wait your turn, or step back and retake.",
        foot: "detector: local MediaPipe Face Landmarker · pick one",
        eye: "multiple faces detected · pick one",
      },
      scanning: {
        kicker: "STATE 06 · SCANNING",
        title: "Downsampling you into a mosaic",
        body: "Your image is crushed into hexagonal dots that light up layer by layer: optic lobe → looming detectors → descending neurons. Please do not bribe the fly while it decides.",
        foot: "spike train recording · window 200 ms · seeded Poisson",
        eye: "downsampling → 817 units · signal propagating",
      },
      result: {
        kicker: "STATE 07 · SCORE",
        body: "Its reaction comes from how hard the escape and turning circuits fire in the same 200 ms window. The needle marks the difference. The looks score gets its own run: brightness and skin tone are flattened out first, leaving only the outline.",
        foot: "These are a fruit fly's beauty standards: 817 pixels, no human ones.",
        eye: "score locked · replay available",
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
      capture: "This frame. Show the fly.",
      closeCam: "Turn off camera",
      retry: "Show your face again",
      pickFace: (n) => `Rate face #${n}`,
      abort: "Cancel",
      replay: "Rate again",
      share: "Download my score card",
      reset: "Try another face",
    },
  },
  share: {
    h2: "Score cards · three fly reactions",
    note1: "1080 × 1920 · portrait",
    note2: "mosaic avatar only, never the original photo",
    cards: [
      {
        kind: "approach",
        code: "APPROACH",
        headline: "FLYING YOUR WAY · APPROACH",
        line: "It turned toward you. In fruit fly terms, that's basically love at first sight.",
        metricKey: "DNa02 turning",
        metricVal: "88 spikes/200ms",
      },
      {
        kind: "hesitate",
        code: "HESITATE",
        headline: "IT FROZE · HESITATE",
        line: "It froze and stared. All 77 looming detectors forgot to vote.",
        metricKey: "LPLC2 looming",
        metricVal: "77 spikes/200ms",
      },
      {
        kind: "escape",
        code: "ESCAPE",
        headline: "IT FLEW OFF · ESCAPE",
        line: "Gone in 212ms. Word is, fruit flies panic around good-looking things too.",
        metricKey: "escape latency",
        metricVal: "212 ms",
      },
    ],
  },
  truth: {
    h2: "Is this legit?",
    p1: "The wiring diagram is real; the scoring is for fun. In 2026, HHMI Janelia and Google Research released MaleCNS, the complete wiring diagram of the male fruit fly's central nervous system: 166,691 neurons and roughly 125 million synapses. This site doesn't load that dataset directly. It borrows the cell types and layer order of the visual pathway and generates a heavily simplified circuit, by rule, right in your browser.",
    p2: "Eye sampling, looming detection and the descending pathway follow real anatomy, but the actual connections and weights are procedurally generated and hand-tuned, not read edge by edge from the connectome. Spike counts come from a simplified model, not experimental recordings. The point cloud is a procedural approximation. The simulation runs about 29,000 units and 100,000 connections, not the full 166,000-neuron brain.",
    notes: [
      {
        k: "HONEST DISCLAIMER",
        v: "A fruit fly sees at roughly 800 pixels and has zero understanding of human beauty. It might want to flee from a slice of toast, too.",
      },
      {
        k: "WHERE THE SCORE COMES FROM",
        v: "Yes, there's a looks score, but a fruit fly is doing the scoring. Before scoring we flatten brightness and contrast, so skin tone and lighting neither add nor subtract points. What's left is subtle, and mostly the fly's mood in that 200 ms: the same photo always gets the same score, a different one might change its mind, just like a real fly. No leaderboard, and the score never leaves your device.",
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
      (ms) => `Gone in ${ms}ms. Word is, fruit flies panic around good-looking things too.`,
      (ms) => `It looked for ${ms}ms, then took off. It's not you. You're just enormous from where it's standing.`,
      (ms) => `Takeoff in ${ms}ms. Slippers, newspapers and you get the same treatment, so don't take it personally.`,
    ],
    approach: [
      () => "It turned toward you. In fruit fly terms, that's basically love at first sight.",
      () => "The turning circuit wins the case. Congratulations, to a fruit fly you do not look like a slipper.",
      () => "It wants a closer look. Odds are it thinks you're a very ripe piece of fruit.",
    ],
    hesitate: [
      () => "It froze and stared. All 77 looming detectors forgot to vote.",
      () => "Flee and approach tied. It just stood there, staring.",
      () => "It stared at you for a long time, then did nothing. That may be the highest respect a fruit fly can give.",
    ],
  },
  score: { label: "LOOKS, TO A FRUIT FLY", unit: "/ 100" },
  tiers: [
    { title: "Fruit fly A-lister", line: "The turning circuit went wild. It nearly forgot it was a fly." },
    { title: "Compound-eye glow-up", line: "All 817 tiny eyes lit up at once. In fly terms, that's a head-turner." },
    { title: "Fly crush material", line: "To it, you're slightly more tempting than a perfectly ripe banana." },
    { title: "Easy on the fly eyes", line: "It took a second look. For a fruit fly, that's a compliment." },
    { title: "Grows on you", line: "At 800 pixels, the fly needs a few more looks to get you." },
  ],
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

export function tierCopy(lang: Lang, verdict: Verdict): Tier {
  return COPY[lang].tiers[flyTier(verdict.flyScore)]!;
}
