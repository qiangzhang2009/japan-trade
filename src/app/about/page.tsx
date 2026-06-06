import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { CheckCircle, Users, Globe, Award } from 'lucide-react';

const TEAM = [
  {
    name: '张小强',
    title: '创始人 & 首席顾问',
    desc: '深耕中日韩贸易咨询领域15年，服务超过200家中国企业成功出海，主导过多个亿元级跨境合作项目。',
    avatar: '张',
  },
  {
    name: '李明',
    title: '合规总监',
    desc: '前日本PMDA审评员，熟悉亚洲各国药监法规，主导过20+药品和保健品海外注册项目。',
    avatar: '李',
  },
  {
    name: '王芳',
    title: '渠道总监',
    desc: '15年亚洲渠道开发经验，覆盖日本、韩国、东南亚主要市场，累计对接渠道商超过500家。',
    avatar: '王',
  },
];

const VALUES = [
  { icon: CheckCircle, title: '结果导向', desc: '我们不为报告买单，只为结果负责——您的成功是我们的唯一指标' },
  { icon: Users, title: '深度陪伴', desc: '从首次咨询到落地履约，全程专业顾问跟踪，随时响应您的需求' },
  { icon: Globe, title: '本地智慧', desc: '我们不只是翻译——每个市场的合作伙伴都有本地专业团队支撑' },
  { icon: Award, title: '合规底线', desc: '绝不推荐灰色路径，所有合作均基于合法合规的商业实践' },
];

export const metadata = {
  title: '关于我们 — 出海通 AsiaBridge',
  description: '上海张小强企业咨询事务所，专注中国企业出海亚洲市场15年',
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0a0a0f] pt-20">
        {/* Hero */}
        <div className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-950 to-[#0a0a0f]" />
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
              我们帮中国企业
              <br />
              <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">找到海外真正的合作伙伴</span>
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
              上海张小强企业咨询事务所，15年来专注一件事——帮助中国企业精准对接海外渠道商、代理商与合作伙伴，让出海不再是摸着石头过河。
            </p>
          </div>
        </div>

        {/* Story */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-white mb-6">我们的故事</h2>
            <div className="prose prose-invert prose-lg max-w-none text-gray-400 leading-relaxed space-y-4">
              <p>
                2009年，张小强在日本东京创立咨询事务所，亲眼见证了无数中国企业在出海过程中踩过的坑——找到了不靠谱的代理商、合规文件不合格被扣货、付了定金对方失联……
              </p>
              <p>
                这些问题的根源只有一个：<strong className="text-white">信息不对称</strong>。海外渠道商的质量参差不齐，中国企业无法有效辨别；各国合规要求差异巨大，没有专业指导寸步难行。
              </p>
              <p>
                我们花了15年建渠道、积累数据、打磨方法论。如今，我们的服务网络覆盖亚洲16个核心市场，直接合作的海外渠道商超过200家，合规通过率98%。
              </p>
              <p>
                <strong className="text-brand-400">出海通 AsiaBridge</strong> 是我们把这些年的积累产品化的成果——让更多中国企业，无论大小，都能享受专业的出海服务。
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-gradient-to-b from-transparent to-brand-950/20">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">我们的价值观</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {VALUES.map((v, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/[0.04] border border-white/5 hover:border-brand-500/20 transition-all">
                  <v.icon className="w-8 h-8 text-brand-400 mb-4" />
                  <h3 className="font-semibold text-white mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">核心团队</h2>
            <div className="space-y-6">
              {TEAM.map((member) => (
                <div key={member.name} className="flex gap-6 p-6 rounded-2xl bg-white/[0.04] border border-white/5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-purple-700 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                    {member.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-white text-lg">{member.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20">{member.title}</span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">{member.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center">
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-white mb-4">准备好开启合作了吗？</h2>
            <p className="text-gray-400 mb-8">无论您是有明确出海计划，还是刚刚萌生想法，我们都愿意与您深入聊聊。</p>
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-brand-600 text-white font-semibold hover:bg-brand-500 transition-all">
              预约咨询
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
