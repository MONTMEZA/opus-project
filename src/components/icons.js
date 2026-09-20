/**
 * Équivalents React Native des icônes lucide-react du prototype.
 * On garde exactement les mêmes noms pour que les écrans se lisent
 * comme le fichier de référence.
 */
import React from 'react';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { C } from '../theme';

const mk = (Set, name) => function Icon({ size = 18, color = C.ink, style }) {
  return <Set name={name} size={size} color={color} style={style} />;
};

// Navigation / interface
export const Home = mk(Feather, 'home');
export const Search = mk(Feather, 'search');
export const PlusSquare = mk(Feather, 'plus-square');
export const MessageCircle = mk(Feather, 'message-circle');
export const User = mk(Feather, 'user');
export const ArrowLeft = mk(Feather, 'arrow-left');
export const Bell = mk(Feather, 'bell');
export const X = mk(Feather, 'x');
export const Check = mk(Feather, 'check');
export const ChevronRight = mk(Feather, 'chevron-right');
export const EyeOff = mk(Feather, 'eye-off');
export const Send = mk(Feather, 'send');
export const Grid = mk(Feather, 'grid');
export const Play = mk(Feather, 'play');
export const Maximize = mk(Feather, 'maximize');
export const Move = mk(Feather, 'move');
export const Trash = mk(Feather, 'trash-2');
export const RefreshCw = mk(Feather, 'refresh-cw');
export const Music = mk(Feather, 'music');
export const Plus = mk(Feather, 'plus');
export const CornerDownRight = mk(Feather, 'corner-down-right');

// Publication
export const Heart = function Heart({ size = 18, color = C.ink, filled = false }) {
  return <MaterialCommunityIcons name={filled ? 'heart' : 'heart-outline'} size={size} color={color} />;
};
export const Bookmark = function Bookmark({ size = 18, color = C.ink, filled = false }) {
  return <MaterialCommunityIcons name={filled ? 'bookmark' : 'bookmark-outline'} size={size} color={color} />;
};
export const Share2 = mk(Feather, 'share-2');
export const MessageSquare = mk(Feather, 'message-square');
export const MapPin = mk(Feather, 'map-pin');
export const Star = mk(MaterialCommunityIcons, 'star');
export const BadgeCheck = mk(MaterialCommunityIcons, 'check-decagram');

// Métiers / BTP
export const HardHat = mk(MaterialCommunityIcons, 'hard-hat');
export const Hammer = mk(MaterialCommunityIcons, 'hammer');
export const Wrench = mk(MaterialCommunityIcons, 'wrench');
export const Paintbrush = mk(MaterialCommunityIcons, 'brush');

// Création
export const Camera = mk(Feather, 'camera');
export const VideoIcon = mk(Feather, 'video');
export const TypeIcon = mk(Feather, 'type');
export const Layers = mk(Feather, 'layers');
export const Lightbulb = mk(MaterialCommunityIcons, 'lightbulb-outline');

// Contact / vérification
export const Phone = mk(Feather, 'phone');
export const FileText = mk(Feather, 'file-text');
export const Users = mk(Feather, 'users');
export const ShieldCheck = mk(MaterialCommunityIcons, 'shield-check');
export const ShieldX = mk(MaterialCommunityIcons, 'shield-off');
export const ClipboardCheck = mk(MaterialCommunityIcons, 'clipboard-check-outline');
export const Sparkles = mk(MaterialCommunityIcons, 'auto-fix');

// SOS / urgences
export const Zap = mk(Feather, 'zap');
export const Key = mk(Feather, 'key');
export const Thermometer = mk(Feather, 'thermometer');
export const AlertTriangle = mk(Feather, 'alert-triangle');
export const Clock = mk(Feather, 'clock');
export const Navigation = mk(Feather, 'navigation');
export const ChevronLeft = mk(Feather, 'chevron-left');
