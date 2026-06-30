import { Info, Mail, Megaphone, MessageSquare, Phone, Zap } from 'lucide-react';
import type { MessagePurpose } from '../types';

export const CHANNELS = [
  { id: "sms", label: "SMS", sub: "90자 이내 단문", icon: Phone },
  { id: "lms", label: "LMS", sub: "2,000자 이내 장문", icon: Mail },
  { id: "kakao-noti", label: "카카오 알림톡", sub: "거래/안내 메시지", icon: MessageSquare },
  { id: "kakao-friend", label: "카카오 친구톡", sub: "마케팅 메시지", icon: Megaphone },
  { id: "rcs", label: "RCS", sub: "리치 미디어 메시지", icon: Zap },
];
export const CHANNEL_LABELS = CHANNELS.map(channel => channel.label);
export const PERSONAL_FIELDS = [
  ["고객명", "#{이름}"],
  ["포인트", "#{포인트}"],
  ["주문번호", "#{주문번호}"],
  ["쿠폰명", "#{쿠폰명}"],
  ["쿠폰만료일", "#{쿠폰만료일}"],
  ["등급", "#{등급}"],
  ["매장명", "#{매장명}"],
  ["배송예정일", "#{배송예정일}"],
  ["추천상품", "#{추천상품}"],
];
export const MESSAGE_PURPOSES: { id: MessagePurpose; label: string; icon: typeof Megaphone; color: "blue" | "green" }[] = [
  { id: "advertising", label: "광고성", icon: Megaphone, color: "blue" },
  { id: "informational", label: "정보성", icon: Info, color: "green" },
];
export const getMessagePurposeMeta = (purpose: MessagePurpose) => MESSAGE_PURPOSES.find(item => item.id === purpose) ?? MESSAGE_PURPOSES[0];
