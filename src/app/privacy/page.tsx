import Link from 'next/link';
import SiteLayout from '@/components/layout/SiteLayout';

export const metadata = {
  title: '隐私政策 | 出海通 AsiaBridge',
};

export default function PrivacyPage() {
  return (
    <SiteLayout>
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-black text-white mb-3">隐私政策</h1>
          <p className="text-blue-300 text-sm">最后更新：2026年3月</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="bg-white rounded-2xl border border-stone-200 p-8">
          <p className="text-stone-600 leading-relaxed mb-6">
            出海通 AsiaBridge（以下简称&quot;我们&quot;）非常重视您的隐私和个人信息保护。本隐私政策说明了我们如何收集、使用、存储和保护您的信息。
          </p>

          <div className="space-y-6">
            {[
              {
                title: '1. 信息收集',
                items: [
                  '当您注册账户时，我们收集您的姓名、邮箱、公司名称、所属行业和所在地区。',
                  '当您浏览商机信息时，我们记录您的浏览偏好以提供个性化推荐。',
                  '当您提交商机信息时，我们收集企业名称、联系方式和商机详情。',
                  '当您联系我们时，我们记录您的联系信息和咨询内容。',
                ],
              },
              {
                title: '2. 信息使用',
                items: [
                  '为您提供商机浏览、筛选和推荐服务。',
                  '处理商机对接请求和会员订阅服务。',
                  '向您推送您感兴趣的商机更新和新商机通知。',
                  '改善我们的产品和服务体验。',
                ],
              },
              {
                title: '3. 信息共享',
                items: [
                  '我们不会将您的个人信息出售给任何第三方广告商。',
                  '您主动提交的商机信息将在平台上公开展示（联系方式除外）。',
                  '商机对接时，仅在您明确授权后将您的联系方式分享给合作方。',
                  '如法律要求，我们可能在合法程序下披露相关信息。',
                ],
              },
              {
                title: '4. 信息安全',
                items: [
                  '所有数据传输采用HTTPS加密协议。',
                  '用户密码使用哈希加密存储，不可逆。',
                  '我们定期进行安全评估，防止数据泄露。',
                  '如发生数据泄露，我们将第一时间通知受影响用户。',
                ],
              },
              {
                title: '5. Cookie政策',
                items: [
                  '我们使用Cookie记住您的浏览偏好和登录状态。',
                  'Cookie的有效期为12个月，您可在浏览器中清除。',
                  '我们不使用Cookie追踪您在其他网站的行为。',
                ],
              },
              {
                title: '6. 您的权利',
                items: [
                  '您有权随时查看、修改或删除您的账户信息。',
                  '您有权退订营销邮件通知。',
                  '您有权要求我们删除您的所有个人信息。',
                  '如需行使上述权利，请发送邮件至 customer@zxqconsulting.com。',
                ],
              },
              {
                title: '7. 联系我们',
                items: [
                  '如对本隐私政策有任何疑问，请联系我们：',
                  '邮箱：customer@zxqconsulting.com',
                  '联系人：张先生 13764872538',
                  '我们将在7个工作日内回复您的请求。',
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
