import { Info, Megaphone, MessageSquare, Phone } from 'lucide-react';
import type { MessagePurpose } from '../types';

export const CHANNELS = [
  { id: "text", label: "문자", sub: "글자 수에 따라 SMS/LMS 자동 적용", icon: Phone },
  { id: "kakao", label: "카카오톡", sub: "알림톡/친구톡 통합", icon: Megaphone },
  { id: "email", label: "이메일", sub: "메일 수신 동의 대상", icon: MessageSquare },
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
