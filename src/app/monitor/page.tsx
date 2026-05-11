import { Metadata } from 'next';
import MonitorClient from './MonitorClient';

export const metadata: Metadata = {
  title: 'ruflo 运营中心 — PROJECT RUFLO',
  description: '观察 AI agent ruflo 如何自主运营出海通 AsiaBridge，¥10 创业实验透明记录。',
  robots: { index: false, follow: false },
};

export default function MonitorPage() {
  return <MonitorClient />;
}
