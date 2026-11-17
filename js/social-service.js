/** Social interactions for community posts and followed chefs. */
import { db, isFirebaseConfigured, doc, getDoc, runTransaction, setDoc, collection, getDocs, query, where, orderBy, limit } from './firebase-config.js';
import { getActiveProfileCache } from './auth-service.js';
import { getMockUsers, saveMockUsers, readStorageJson, writeStorageJson } from './services/mock-storage.js';
import { getFollowingIds, getFollowedFeed, toggleMember, isPresenceFresh, getConversationId, normalizeChatMessage } from './social-data.js';
import { getProfileGenderLabel } from './profile-data.js';

const SOCIAL_KEY = 'yumcraft_social_state';
const ONLINE_WINDOW_MS = 120_000;
let presenceHeartbeat = null;
let beforeUnloadHandler = null;
let activePresenceProfile = null;
const signedInProfile = () => {
  const profile = getActiveProfileCache();
  if (!profile?.uid) throw new Error('Vui lòng đăng nhập để sử dụng tính năng cộng đồng.');
  return profile;
};
const readLocal = () => {
  const value = readStorageJson(SOCIAL_KEY, {});
  return {
    likes: value?.likes && typeof value.likes === 'object' ? value.likes : {},
    following: value?.following && typeof value.following === 'object' ? value.following : {},
    invites: Array.isArray(value?.invites) ? value.invites : [],
    chats: value?.chats && typeof value.chats === 'object' ? value.chats : {}
  };
};
const writeLocal = (data) => writeStorageJson(SOCIAL_KEY, data);

export async function toggleCommunityLike(postId) {
  if (!postId) throw new Error('Thiếu mã công thức cần thích.');
  const profile = signedInProfile();
  const local = readLocal();
  const localResult = toggleMember(local.likes[postId], profile.uid);
  local.likes[postId] = localResult.members;

  if (isFirebaseConfigured() && db) {
    const postRef = doc(db, 'community_dishes', postId);
    const result = await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(postRef);
      if (!snapshot.exists()) throw new Error('Công thức không còn tồn tại.');
      const members = toggleMember(snapshot.data().likedBy, profile.uid);
      transaction.set(postRef, { likedBy: members.members, likeCount: members.members.length }, { merge: true });
      return members;
    });
    local.likes[postId] = result.members;
    writeLocal(local);
    return { liked: result.active, likeCount: result.members.length };
  }

  writeLocal(local);
  return { liked: localResult.active, likeCount: localResult.members.length };
}

export async function toggleFollowChef(targetUid) {
  if (!targetUid) throw new Error('Thiếu mã đầu bếp cần theo dõi.');
  const profile = signedInProfile();
  if (profile.uid === targetUid) throw new Error('Bạn không thể tự theo dõi chính mình.');
  const local = readLocal();
  const localResult = toggleMember(local.following[profile.uid], targetUid);
  local.following[profile.uid] = localResult.members;

  if (isFirebaseConfigured() && db) {
    const userRef = doc(db, 'users', profile.uid);
    const targetRef = doc(db, 'users', targetUid);
    const result = await runTransaction(db, async (transaction) => {
      const [userSnapshot, targetSnapshot] = await Promise.all([transaction.get(userRef), transaction.get(targetRef)]);
      if (!targetSnapshot.exists()) throw new Error('Không tìm thấy hồ sơ đầu bếp này.');
      const following = toggleMember(userSnapshot.data()?.following, targetUid);
      const followers = toggleMember(targetSnapshot.data()?.followers, profile.uid);
      transaction.set(userRef, { following: following.members, followingCount: following.members.length }, { merge: true });
      transaction.set(targetRef, { followers: followers.members, followerCount: followers.members.length }, { merge: true });
      return following;
    });
    local.following[profile.uid] = result.members;
    writeLocal(local);
    return { following: result.active, followingCount: result.members.length };
  }

  writeLocal(local);
  return { following: localResult.active, followingCount: localResult.members.length };
}

export async function getFollowingChefIds() {
  const profile = signedInProfile();
  if (isFirebaseConfigured() && db) {
    const snapshot = await getDoc(doc(db, 'users', profile.uid));
    const ids = getFollowingIds(snapshot.exists() ? snapshot.data().following : []);
    const local = readLocal();
    local.following[profile.uid] = ids;
    writeLocal(local);
    return ids;
  }
  return getFollowingIds(readLocal().following[profile.uid]);
}

export function hydrateCommunitySocial(posts) {
  if (isFirebaseConfigured() && db) return posts;
  const profile = getActiveProfileCache();
  if (!profile?.uid) return posts;
  const likes = readLocal().likes;
  return posts.map((post) => {
    const likedBy = getFollowingIds(likes[post.id]);
    return { ...post, likedBy, likeCount: likedBy.length };
  });
}

function updateLocalPresence(uid, isOnline) {
  const users = getMockUsers();
  const user = users.find((entry) => entry.uid === uid);
  if (!user) return;
  user.isOnline = isOnline;
  user.lastSeenAt = new Date().toISOString();
  saveMockUsers(users);
}

async function writePresence(profile, isOnline) {
  const timestamp = new Date().toISOString();
  const visibleOnline = isOnline && profile.privacySettings?.showOnlineStatus !== false;
  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'users', profile.uid), { isOnline: visibleOnline, lastSeenAt: timestamp }, { merge: true });
  } else {
    updateLocalPresence(profile.uid, visibleOnline);
  }
}

export function startChefPresence(profile) {
  if (!profile?.uid) return;
  activePresenceProfile = profile;
  if (presenceHeartbeat) clearInterval(presenceHeartbeat);
  if (beforeUnloadHandler && typeof window !== 'undefined') window.removeEventListener('beforeunload', beforeUnloadHandler);
  void writePresence(profile, true).catch((error) => console.warn('Không thể cập nhật trạng thái online:', error));
  presenceHeartbeat = setInterval(() => {
    void writePresence(profile, true).catch((error) => console.warn('Không thể làm mới trạng thái online:', error));
  }, 45_000);
  beforeUnloadHandler = () => { void writePresence(profile, false).catch(() => {}); };
  if (typeof window !== 'undefined') window.addEventListener('beforeunload', beforeUnloadHandler);
}

export async function stopChefPresence(profile = activePresenceProfile || getActiveProfileCache()) {
  if (presenceHeartbeat) clearInterval(presenceHeartbeat);
  presenceHeartbeat = null;
  if (beforeUnloadHandler && typeof window !== 'undefined') window.removeEventListener('beforeunload', beforeUnloadHandler);
  beforeUnloadHandler = null;
  if (profile?.uid) {
    try { await writePresence(profile, false); }
    catch (error) { console.warn('Không thể cập nhật trạng thái offline:', error); }
  }
  activePresenceProfile = null;
}

export async function getOnlineChefs() {
  const now = Date.now();
  let users;
  if (isFirebaseConfigured() && db) {
    const snapshot = await getDocs(query(collection(db, 'users'), where('isOnline', '==', true)));
    users = [];
    snapshot.forEach((userDoc) => users.push({ uid: userDoc.id, ...userDoc.data() }));
  } else {
    users = getMockUsers();
  }
  return users
    .filter((user) => user.uid && user.isBanned !== true && user.privacySettings?.profileVisibility !== 'private' && user.privacySettings?.showOnlineStatus !== false && user.isOnline && isPresenceFresh(user.lastSeenAt, now, ONLINE_WINDOW_MS))
    .map((user) => ({ uid: user.uid, username: user.username || 'chef', displayName: user.displayName || user.username || 'Bếp Trưởng', kitchenName: user.kitchenName || 'Nhà Bếp Sáng Tạo', bio: user.privacySettings?.showBio === false ? '' : (user.bio || ''), gender: user.privacySettings?.showGender === false ? '' : (user.gender && user.gender !== 'unspecified' ? getProfileGenderLabel(user.gender) : ''), followerCount: Number(user.followerCount) || 0 }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'vi'));
}

export async function getChefPublicProfile(uid) {
  if (!uid) throw new Error('Thiếu mã hồ sơ đầu bếp.');
  let profile;
  if (isFirebaseConfigured() && db) {
    const snapshot = await getDoc(doc(db, 'users', uid));
    if (!snapshot.exists()) throw new Error('Không tìm thấy hồ sơ đầu bếp này.');
    profile = { uid: snapshot.id, ...snapshot.data() };
  } else {
    profile = getMockUsers().find((user) => user.uid === uid);
    if (!profile) throw new Error('Không tìm thấy hồ sơ đầu bếp này.');
  }
  if (profile.isBanned) throw new Error('Hồ sơ này hiện không khả dụng.');
  const currentProfile = getActiveProfileCache();
  if (profile.privacySettings?.profileVisibility === 'private' && currentProfile?.uid !== profile.uid) {
    throw new Error('Đầu bếp này đã đặt hồ sơ ở chế độ riêng tư.');
  }
  return {
    uid: profile.uid,
    username: profile.username || 'chef',
    displayName: profile.displayName || profile.username || 'Bếp Trưởng',
    kitchenName: profile.kitchenName || 'Nhà Bếp Sáng Tạo',
    bio: profile.privacySettings?.showBio === false ? '' : (profile.bio || ''),
    gender: profile.privacySettings?.showGender === false ? '' : (profile.gender && profile.gender !== 'unspecified' ? getProfileGenderLabel(profile.gender) : ''),
    followerCount: Number(profile.followerCount) || 0,
    followingCount: Number(profile.followingCount) || 0,
    totalScore: Number(profile.totalScore) || 0
  };
}

const createId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`;

export async function sendKitchenInvite(targetUid, targetName = '') {
  if (!targetUid) throw new Error('Chọn đầu bếp cần mời vào bếp.');
  const profile = signedInProfile();
  if (profile.uid === targetUid) throw new Error('Bạn không thể tự mời mình.');
  const inviteId = getConversationId(profile.uid, targetUid);
  const invitation = {
    id: inviteId,
    senderUid: profile.uid,
    senderName: profile.displayName || profile.username || 'Bếp Trưởng',
    senderKitchen: profile.kitchenName || 'Nhà Bếp Sáng Tạo',
    recipientUid: targetUid,
    recipientName: targetName || '',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  if (isFirebaseConfigured() && db) {
    const inviteRef = doc(db, 'kitchen_invites', inviteId);
    await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(inviteRef);
      if (existing.exists() && existing.data().status === 'pending') throw new Error('Bạn đã gửi lời mời đang chờ đầu bếp này phản hồi.');
      transaction.set(inviteRef, invitation);
    });
  } else {
    const data = readLocal();
    if (data.invites.some((invite) => invite.id === inviteId && invite.status === 'pending')) {
      throw new Error('Bạn đã gửi lời mời đang chờ đầu bếp này phản hồi.');
    }
    data.invites = [invitation, ...data.invites.filter((invite) => invite.id !== inviteId)];
    writeLocal(data);
  }
  return invitation;
}

export async function getKitchenInvites() {
  const profile = signedInProfile();
  if (isFirebaseConfigured() && db) {
    const [incoming, outgoing] = await Promise.all([
      getDocs(query(collection(db, 'kitchen_invites'), where('recipientUid', '==', profile.uid))),
      getDocs(query(collection(db, 'kitchen_invites'), where('senderUid', '==', profile.uid)))
    ]);
    const invites = new Map();
    [incoming, outgoing].forEach((snapshot) => snapshot.forEach((entry) => invites.set(entry.id, { ...entry.data(), id: entry.id })));
    return [...invites.values()].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }
  return readLocal().invites
    .filter((invite) => invite.senderUid === profile.uid || invite.recipientUid === profile.uid)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function respondToKitchenInvite(inviteId, response) {
  if (!['accepted', 'declined'].includes(response)) throw new Error('Phản hồi lời mời không hợp lệ.');
  const profile = signedInProfile();
  if (isFirebaseConfigured() && db) {
    const inviteRef = doc(db, 'kitchen_invites', inviteId);
    return runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(inviteRef);
      if (!snapshot.exists() || snapshot.data().recipientUid !== profile.uid) throw new Error('Không tìm thấy lời mời dành cho bạn.');
      if (snapshot.data().status !== 'pending') throw new Error('Lời mời này đã được xử lý.');
      transaction.set(inviteRef, { status: response, respondedAt: new Date().toISOString() }, { merge: true });
      return { ...snapshot.data(), id: snapshot.id, status: response };
    });
  }
  const data = readLocal();
  const invite = data.invites.find((entry) => entry.id === inviteId && entry.recipientUid === profile.uid);
  if (!invite) throw new Error('Không tìm thấy lời mời dành cho bạn.');
  if (invite.status !== 'pending') throw new Error('Lời mời này đã được xử lý.');
  invite.status = response;
  invite.respondedAt = new Date().toISOString();
  writeLocal(data);
  return invite;
}

export async function getDirectMessages(otherUid) {
  const profile = signedInProfile();
  const conversationId = getConversationId(profile.uid, otherUid);
  if (isFirebaseConfigured() && db) {
    const messages = await getDocs(query(collection(db, 'chats', conversationId, 'messages'), orderBy('createdAt', 'desc'), limit(50)));
    return messages.docs.map((entry) => ({ ...entry.data(), id: entry.id })).reverse();
  }
  const stored = readLocal().chats[conversationId];
  const messages = Array.isArray(stored) ? stored : stored?.messages;
  return (Array.isArray(messages) ? messages : []).slice(-50);
}

export async function sendDirectMessage(otherUid, text) {
  const profile = signedInProfile();
  const messageText = normalizeChatMessage(text);
  const conversationId = getConversationId(profile.uid, otherUid);
  const message = {
    id: createId(),
    senderUid: profile.uid,
    senderName: profile.displayName || profile.username || 'Bếp Trưởng',
    text: messageText,
    createdAt: new Date().toISOString()
  };
  if (isFirebaseConfigured() && db) {
    const chatRef = doc(db, 'chats', conversationId);
    await setDoc(chatRef, {
      participants: [profile.uid, otherUid],
      updatedAt: message.createdAt,
      lastMessage: message.text,
      lastSenderUid: profile.uid
    }, { merge: true });
    await setDoc(doc(db, 'chats', conversationId, 'messages', message.id), message);
  } else {
    const data = readLocal();
    const stored = data.chats[conversationId];
    const messages = Array.isArray(stored) ? stored : stored?.messages || [];
    data.chats[conversationId] = {
      participants: [profile.uid, otherUid],
      messages: [...messages, message].slice(-200),
      updatedAt: message.createdAt,
      lastMessage: message.text,
      lastSenderUid: profile.uid
    };
    writeLocal(data);
  }
  return message;
}

export async function getMyConversations() {
  const profile = signedInProfile();
  if (isFirebaseConfigured() && db) {
    const snapshot = await getDocs(query(collection(db, 'chats'), where('participants', 'array-contains', profile.uid)));
    const conversations = await Promise.all(snapshot.docs.map(async (entry) => {
      const data = entry.data();
      const otherUid = (data.participants || []).find((uid) => uid !== profile.uid);
      if (!otherUid) return null;
      let chef = { uid: otherUid, displayName: data.participantNames?.[otherUid] || 'Đầu bếp', username: 'chef', kitchenName: 'Nhà Bếp Sáng Tạo' };
      try { chef = { ...chef, ...await getChefPublicProfile(otherUid) }; } catch {}
      return { ...chef, conversationId: entry.id, lastMessage: data.lastMessage || '', lastSenderUid: data.lastSenderUid || '', updatedAt: data.updatedAt || '' };
    }));
    return conversations.filter(Boolean).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }

  const result = [];
  const users = getMockUsers();
  Object.entries(readLocal().chats).forEach(([conversationId, value]) => {
    const messages = Array.isArray(value) ? value : value?.messages || [];
    const participants = Array.isArray(value?.participants)
      ? value.participants
      : [...new Set(messages.map((message) => message.senderUid).filter(Boolean))];
    const otherUid = participants.find((uid) => uid !== profile.uid);
    if (!otherUid) return;
    const other = users.find((user) => user.uid === otherUid) || {};
    const lastMessage = Array.isArray(messages) ? messages[messages.length - 1] : null;
    result.push({
      uid: otherUid,
      username: other.username || 'chef',
      displayName: other.displayName || lastMessage?.senderName || 'Đầu bếp',
      kitchenName: other.kitchenName || 'Nhà Bếp Sáng Tạo',
      conversationId,
      lastMessage: Array.isArray(value) ? (lastMessage?.text || '') : (value?.lastMessage || ''),
      lastSenderUid: Array.isArray(value) ? (lastMessage?.senderUid || '') : (value?.lastSenderUid || ''),
      updatedAt: Array.isArray(value) ? (lastMessage?.createdAt || '') : (value?.updatedAt || '')
    });
  });
  return result.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

export { getFollowedFeed } from './social-data.js';
