import Link from 'next/link';
import SiteLayout from '@/components/layout/SiteLayout';

export const metadata = {
  title: '使用条款 | 出海通 AsiaBridge',
};

export default function TermsPage() {
  return (
    <SiteLayout>
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-black text-white mb-3">使用条款</h1>
          <p className="text-blue-300 text-sm">最后更新：2026年3月</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="bg-white rounded-2xl border border-stone-200 p-8">
          <p className="text-stone-600 leading-relaxed mb-6">
            欢迎使用出海通 AsiaBridge（以下简称&quot;本平台&quot;）。在使用本平台服务前，请仔细阅读以下使用条款。当您访问或使用本平台时，即表示您已同意受本条款的约束。
          </p>

          <div className="space-y-6">
            {[
              {
                title: '1. 服务说明',
                items: [
                  '本平台为商业商机信息聚合平台，帮助用户发现东南亚和东亚地区的商业合作机会。',
                  '我们不对商机信息的真实性、完整性或及时性作出任何明示或暗示的保证。',
                  '用户应自行判断商机信息的价值，并在进行任何商业决策前进行独立调查。',
                  '本平台有权随时调整、修改或中断服务，恕不另行通知。',
                ],
              },
              {
                title: '2. 用户行为规范',
                items: [
                  '用户须保证所发布的商机信息真实、准确、完整，不含虚假或误导性内容。',
                  '用户不得利用本平台从事任何违法活动，包括但不限于诈骗、洗钱、传销等。',
                  '用户不得侵犯他人的知识产权、隐私权或其他合法权益。',
                  '用户不得干扰本平台的正常运行，不得使用自动化工具批量抓取平台数据。',
                  '用户不得冒充他人或以虚假身份发布信息。',
                ],
              },
              {
                title: '3. 知识产权',
                items: [
                  '本平台上所有内容（文字、图片、数据结构等）的版权均归本平台所有。',
                  '用户在本平台发布的内容，版权由用户所有，但用户授予本平台非独占、永久、免费的使用权。',
                  '未经授权，用户不得复制、修改、传播本平台的专有内容。',
                  '本平台名称、Logo及相关标识受商标法保护。',
                ],
              },
              {
                title: '4. 免责声明',
                items: [
                  '本平台不对用户之间的商业合作结果负责，任何合作风险由用户自行承担。',
                  '因网络故障、系统维护、黑客攻击等不可抗力导致的损失，本平台不承担责任。',
                  '本平台上的商机信息不代表我们对任何企业、产品或服务的背书。',
                  '用户因使用本平台信息而遭受的损失，我们不承担任何赔偿责任。',
                ],
              },
              {
                title: '5. 会员服务',
                items: [
                  '会员订阅按月或按年计费，支持支付宝、微信和信用卡付款。',
                  '订阅可随时取消，取消后权益持续到当期订阅结束。',
                  '我们提供7天无理由退款保障（企业定制服务除外）。',
                  '会员权益不可转让、不可折现。',
                ],
              },
              {
                title: '6. 数据使用',
                items: [
                  '本平台的数据来源于各国政府机构、贸易促进组织和公开可获取的媒体渠道。',
                  '我们不对数据源的可用性、数据的准确性或完整性作出保证。',
                  '用户可将本平台数据用于个人商业参考，但不得用于商业再分发或转售。',
                  '数据采集会每6小时自动运行，但本平台不对采集失败或数据延迟承担责任。',
                ],
              },
              {
                title: '7. 终止服务',
                items: [
                  '如用户违反本使用条款，我们有权在不通知的情况下暂停或终止其账户。',
                  '如用户滥用平台服务（如批量爬取数据、发布垃圾信息等），我们保留追究法律责任的权利。',
                  '终止服务后，用户的未使用订阅费用不予退还。',
                ],
              },
              {
                title: '8. 条款修改',
                items: [
                  '我们保留随时修改本使用条款的权利。',
                  '修改后的条款将在本页面公布，继续使用本平台即表示接受新条款。',
                  '如您不同意修改后的条款，应停止使用本平台服务。',
                ],
              },
              {
                title: '9. 适用法律与管辖',
                items: [
                  '本使用条款受中华人民共和国法律管辖。',
                  '如因使用本平台发生争议，双方应首先通过友好协商解决。',
                  '协商不成的，任一方可向本平台运营主体所在地有管辖权的人民法院提起诉讼。',
                ],
              },
              {
                title: '10. 联系我们',
                items: [
                  '如对本使用条款有任何疑问，请发送邮件至 customer@zxqconsulting.com 或致电 13764872538（联系人：张先生）。',
                ],
              },
            ].map(section => (
              <div key={section.title}>
                <h2 className="text-lg font-black text-stone-900 mb-3">{section.title}</h2>
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-stone-600">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
            ← 返回首页
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
