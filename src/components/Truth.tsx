export function Truth() {
  return (
    <section id="truth" className="fv-section">
      <div className="fv-inner fv-truth">
        <div>
          <h2 className="fv-h2 mb-[30px]">这是真的吗</h2>
          <p className="mb-[22px] max-w-[60ch] font-[family-name:var(--serif)] text-[19px] leading-[1.62] text-[color:var(--ink-2)]">
            连接组是真的。2026 年 HHMI Janelia 与 Google Research 公布了 MaleCNS，雄性果蝇中枢神经系统的完整接线图：166,691 个神经元，约 1.25 亿个突触。本站在你的浏览器里按这份接线图做了一个高度简化的仿真。
          </p>
          <p className="mb-[22px] font-[family-name:var(--sans)] text-sm leading-[1.8] text-[color:var(--ink-2)]">
            复眼取景、逼近检测、下行通路的结构关系来自真实解剖；放电强度是简化模型的输出，不是实验记录。点云形态为程序化近似。仿真只跑视觉通路到下行神经元的几万个单元，不是 16 万个神经元全脑。
          </p>
          <div className="border-t border-[color:var(--line)] pt-[22px] font-[family-name:var(--mono)] text-[10.5px] leading-[2] tracking-[0.06em] text-[color:var(--ink-3)]">
            DATA SOURCE
            <br />
            <span className="text-[color:var(--ink-2)]">
              MaleCNS connectome, HHMI Janelia FlyEM & Google Research, CC-BY
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-px self-start border border-[color:var(--line)] bg-[color:var(--line)]">
          <div className="bg-[color:var(--bg-2)] px-7 py-[26px]">
            <div className="mb-3 font-[family-name:var(--mono)] text-[10px] tracking-[0.2em] text-[color:var(--amber)]">
              诚实声明 / DISCLAIMER
            </div>
            <div className="font-[family-name:var(--sans)] text-sm leading-[1.8] text-[color:var(--ink-2)]">
              果蝇的视力大约相当于 800 像素，而且它完全不理解人类的审美。它对一片吐司也可能想逃跑。
            </div>
          </div>
          <div className="bg-[color:var(--bg-2)] px-7 py-[26px]">
            <div className="mb-3 font-[family-name:var(--mono)] text-[10px] tracking-[0.2em] text-[color:var(--iris)]">
              被评价的是谁
            </div>
            <div className="font-[family-name:var(--sans)] text-sm leading-[1.8] text-[color:var(--ink-2)]">
              这不是颜值打分。这里没有分数、没有百分比、没有排行榜。我们测量的是一只苍蝇的反射，不是你的脸。
            </div>
          </div>
          <div className="bg-[color:var(--bg-2)] px-7 py-[26px]">
            <div className="mb-3 font-[family-name:var(--mono)] text-[10px] tracking-[0.2em] text-[color:var(--verde)]">
              你的数据
            </div>
            <div className="font-[family-name:var(--sans)] text-sm leading-[1.8] text-[color:var(--ink-2)]">
              摄像头画面与照片全程只存在于当前页面的内存里。仿真、人脸检测、马赛克化都在本地完成。关掉标签页，一切消失。
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
