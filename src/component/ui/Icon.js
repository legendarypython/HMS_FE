import React from 'react';
import {
  FileText, Inbox, Calendar, Filter, HeartPulse, ShieldCheck, Star, Phone,
  Mail, MapPin, Clock, Users, Award, Stethoscope, Baby, CheckCircle2,
  ArrowRight, Menu, X, User, Lock, ChevronRight, Sparkles, Quote, Home, LogOut,
  QrCode, Pencil, CalendarOff, Bell, Search,
} from 'lucide-react';

// Keeps the existing <Icon name="..." size={} /> call sites unchanged while
// swapping the hand-rolled SVG paths for lucide-react's icon set.
const ICONS = {
  file: FileText,
  inbox: Inbox,
  calendar: Calendar,
  filter: Filter,
  heart: HeartPulse,
  shield: ShieldCheck,
  star: Star,
  phone: Phone,
  mail: Mail,
  'map-pin': MapPin,
  clock: Clock,
  users: Users,
  award: Award,
  stethoscope: Stethoscope,
  baby: Baby,
  'check-circle': CheckCircle2,
  'arrow-right': ArrowRight,
  menu: Menu,
  close: X,
  user: User,
  lock: Lock,
  'chevron-right': ChevronRight,
  sparkles: Sparkles,
  quote: Quote,
  home: Home,
  logout: LogOut,
  'qr-code': QrCode,
  edit: Pencil,
  'calendar-off': CalendarOff,
  bell: Bell,
  search: Search,
};

const Icon = ({ name, size = 20, className = '', strokeWidth = 1.8 }) => {
  const LucideIcon = ICONS[name] || FileText;
  return <LucideIcon size={size} className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
};

export default Icon;
