import type { CSSProperties } from 'react';
import {
  HouseIcon, CompassIcon, ChatsCircleIcon, BellIcon, UserIcon, CaretLeftIcon, CaretRightIcon, CaretDownIcon, XIcon,
  PlusIcon, MagnifyingGlassIcon, DotsThreeIcon, DotsThreeVerticalIcon, ArrowLeftIcon, ArrowUpIcon,
  SlidersHorizontalIcon, SquaresFourIcon, StarIcon, TrendUpIcon, FireIcon, ChatCircleIcon, ChatCircleTextIcon,
  HeartIcon, PaperPlaneTiltIcon, ArrowBendUpLeftIcon, AtIcon, PushPinIcon, FlagIcon, TrashIcon, ProhibitIcon,
  ArrowClockwiseIcon, ClockIcon, ShieldCheckIcon, LockSimpleIcon, GlobeIcon, UsersIcon, UserPlusIcon, UserMinusIcon,
  SignOutIcon, ArchiveIcon, LinkSimpleIcon, EnvelopeSimpleIcon, CalendarBlankIcon, CalendarPlusIcon, BellSlashIcon,
  BookOpenIcon, BookmarkSimpleIcon, MegaphoneIcon, CrownSimpleIcon, CreditCardIcon, PencilSimpleIcon, InfoIcon,
  CameraIcon, EyeIcon, EyeSlashIcon, CheckIcon, CheckCircleIcon, XCircleIcon, WarningCircleIcon, WifiSlashIcon,
  CircleNotchIcon, SmileyBlankIcon, CopyIcon, BroadcastIcon,
} from '@phosphor-icons/react';

// The Figma Icons page uses the Phosphor set (Regular / Bold / Fill). Names match Figma's "Icon/<Name>".
const ICONS = {
  House: HouseIcon, Compass: CompassIcon, ChatsCircle: ChatsCircleIcon, Bell: BellIcon, User: UserIcon,
  CaretLeft: CaretLeftIcon, CaretRight: CaretRightIcon, CaretDown: CaretDownIcon, X: XIcon, Plus: PlusIcon,
  MagnifyingGlass: MagnifyingGlassIcon, DotsThree: DotsThreeIcon, DotsThreeVertical: DotsThreeVerticalIcon,
  ArrowLeft: ArrowLeftIcon, ArrowUp: ArrowUpIcon, SlidersHorizontal: SlidersHorizontalIcon, SquaresFour: SquaresFourIcon,
  Star: StarIcon, TrendUp: TrendUpIcon, Fire: FireIcon, ChatCircle: ChatCircleIcon, ChatCircleText: ChatCircleTextIcon,
  Heart: HeartIcon, PaperPlaneTilt: PaperPlaneTiltIcon, ArrowBendUpLeft: ArrowBendUpLeftIcon, At: AtIcon,
  PushPin: PushPinIcon, Flag: FlagIcon, Trash: TrashIcon, Prohibit: ProhibitIcon, ArrowClockwise: ArrowClockwiseIcon,
  Clock: ClockIcon, ShieldCheck: ShieldCheckIcon, LockSimple: LockSimpleIcon, Globe: GlobeIcon, Users: UsersIcon,
  UserPlus: UserPlusIcon, UserMinus: UserMinusIcon, SignOut: SignOutIcon, Archive: ArchiveIcon, LinkSimple: LinkSimpleIcon,
  EnvelopeSimple: EnvelopeSimpleIcon, CalendarBlank: CalendarBlankIcon, CalendarPlus: CalendarPlusIcon,
  BellSlash: BellSlashIcon, BookOpen: BookOpenIcon, BookmarkSimple: BookmarkSimpleIcon, Megaphone: MegaphoneIcon,
  CrownSimple: CrownSimpleIcon, CreditCard: CreditCardIcon, PencilSimple: PencilSimpleIcon, Info: InfoIcon,
  Camera: CameraIcon, Eye: EyeIcon, EyeSlash: EyeSlashIcon, Check: CheckIcon, CheckCircle: CheckCircleIcon,
  XCircle: XCircleIcon, WarningCircle: WarningCircleIcon, WifiSlash: WifiSlashIcon, CircleNotch: CircleNotchIcon,
  SmileyBlank: SmileyBlankIcon, Copy: CopyIcon, Broadcast: BroadcastIcon,
} as const;

export type IconName = keyof typeof ICONS;
export type IconTone = 'default' | 'secondary' | 'tertiary' | 'on-fill' | 'accent' | 'danger' | 'disabled' | 'inverse' | 'link' | 'current';

type Props = {
  name: IconName;
  size?: number;
  weight?: 'regular' | 'bold' | 'fill';
  tone?: IconTone;
  spin?: boolean;
  style?: CSSProperties;
  className?: string;
};

export function Icon({ name, size = 24, weight = 'regular', tone = 'default', spin, style, className }: Props) {
  const C = ICONS[name];
  const color = tone === 'current' ? 'currentColor' : tone === 'link' ? 'var(--text-link)' : `var(--icon-${tone})`;
  return <C size={size} weight={weight} color={color} style={style} className={[spin ? 'spin' : '', className ?? ''].join(' ')} />;
}
