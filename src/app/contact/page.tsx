import type { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: '联系我们 | 出海通 AsiaBridge',
  description: '联系出海通 AsiaBridge 团队，获取商机咨询、会员服务、商务合作等支持。我们将在24小时内回复您。',
};

export default function ContactPage() {
  return <ContactClient />;
}
