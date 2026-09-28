import type { ComponentType } from 'react';
import type { Params } from '../lib/nav';
import { Launch, Onboarding } from './onboarding';
import {
  SignUp, VerifyEmail, ChooseUsername, PickGenres, JoinBookclubs, LogIn, ForgotPassword, ResetSent, ResetExpired, SetNewPassword,
} from './auth';
import { Home } from './home';
import { Bookclubs } from './bookclubs';
import { Chat } from './chat';
import { Thread } from './thread';
import { Discover, Search, ClubPreview, Channels } from './discover';
import { Alerts, InvitationReceived, ModerationReason } from './alerts';
import { ClubInfo, ManageMembers, MemberSearch, InvitePeople, EditClub } from './clubinfo';
import { CreateClub, CreatedInvite } from './create';
import {
  Profile, EditProfile, NotificationPrefs, PendingRequests, EditInterests, Appearance, AccountSettings, ChangePassword, NewPassword,
  DeleteAccount, DeleteConfirm, About, ContentRules, Terms, Privacy, ContactSupport,
} from './profile';
import { Plans, WhatsIncluded } from './plans';
import { KeepActive, LockScreen, AndroidShade } from './misc';

export const SCREENS: Record<string, ComponentType<{ params: Params }>> = {
  launch: Launch,
  onboarding: Onboarding,
  signup: SignUp,
  verify: VerifyEmail,
  username: ChooseUsername,
  genres: PickGenres,
  'join-clubs': JoinBookclubs,
  login: LogIn,
  forgot: ForgotPassword,
  'reset-sent': ResetSent,
  'reset-expired': ResetExpired,
  'set-password': SetNewPassword,
  home: Home,
  bookclubs: Bookclubs,
  chat: Chat,
  thread: Thread,
  discover: Discover,
  search: Search,
  'club-preview': ClubPreview,
  channels: Channels,
  alerts: Alerts,
  invitation: InvitationReceived,
  moderation: ModerationReason,
  'club-info': ClubInfo,
  members: ManageMembers,
  'member-search': MemberSearch,
  invite: InvitePeople,
  'edit-club': EditClub,
  create: CreateClub,
  'created-invite': CreatedInvite,
  profile: Profile,
  'edit-profile': EditProfile,
  'notification-prefs': NotificationPrefs,
  'pending-requests': PendingRequests,
  interests: EditInterests,
  appearance: Appearance,
  account: AccountSettings,
  'change-password': ChangePassword,
  'new-password': NewPassword,
  'delete-account': DeleteAccount,
  'delete-confirm': DeleteConfirm,
  about: About,
  'content-rules': ContentRules,
  terms: Terms,
  privacy: Privacy,
  'contact-support': ContactSupport,
  plans: Plans,
  'whats-included': WhatsIncluded,
  'keep-active': KeepActive,
  'lock-screen': LockScreen,
  'android-shade': AndroidShade,
};
