/** Social interactions for community posts and followed chefs. */
import { db, isFirebaseConfigured, doc, getDoc, runTransaction, setDoc, collection, getDocs, query, where, orderBy, limit } from './firebase-config.js';
import { getActiveProfileCache } from './auth-service.js';
import { getMockUsers, saveMockUsers, readStorageJson, writeStorageJson } from './services/mock-storage.js';
import { getFollowingIds, getFollowedFeed, toggleMember, getConversationId, normalizeChatMessage, isChefBlocked, toggleBlockedChef, filterOnlineChefs, canViewChefProfile, canReceiveKitchenInvites, canReceiveDirectMessages, getStoredChatMessages, getLocalConversationSummary } from './social-data.js';
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

async function getPrivacySettingsForUser(uid) {
  if (isFirebaseConfigured() && db) {
    const snapshot = await getDoc(doc(db, 'users', uid));
    if (!snapshot.exists()) throw new Error('Không tìm thấy đầu bếp này.');
    return snapshot.data().privacySettings || {};
  }
  const target = getMockUsers().find((user) => user.uid === uid);
  if (!target) throw new Error('Không tìm thấy đầu bếp này.');
  return target.privacySettings || {};
}

async function getBlockedIdsForUser(uid) {
  if (isFirebaseConfigured() && db) {
    const snapshot = await getDoc(doc(db, 'users', uid));
    return snapshot.exists() && Array.isArray(snapshot.data().blockedChefIds) ? snapshot.data().blockedChefIds : [];
  }
  const user = getMockUsers().find((entry) => entry.uid === uid);
  return Array.isArray(user?.blockedChefIds) ? user.blockedChefIds : [];
}

async function isBlockedEitherDirection(otherUid) {
  const profile = signedInProfile();
  if (!otherUid || otherUid === profile.uid) throw new Error('Chọn một đầu bếp khác.');
  const [mine, theirs] = await Promise.all([
    getBlockedIdsForUser(profile.uid),
    getBlockedIdsForUser(otherUid)
  ]);
  return isChefBlocked(mine, theirs, profile.uid, otherUid);
}

async function assertNotBlocked(otherUid) {
  if (await isBlockedEitherDirection(otherUid)) throw new Error('Không thể tương tác với đầu bếp này vì có người đã chặn đối phương.');
}

export async function getBlockedChefIds() {
  return getBlockedIdsForUser(signedInProfile().uid);
}

export async function getBlockedChefs() {
  const ids = await getBlockedChefIds();
  const users = getMockUsers();
  return Promise.all(ids.map(async (uid) => {
    if (isFirebaseConfigured() && db) {
      const snapshot = await getDoc(doc(db, 'users', uid));
      if (!snapshot.exists()) return { uid, displayName: 'Đầu bếp không còn tồn tại' };
      const user = snapshot.data();
      return { uid, displayName: user.displayName || user.username || 'Đầu bếp', username: user.username || 'chef' };
    }
    const user = users.find((entry) => entry.uid === uid);
    return { uid, displayName: user?.displayName || user?.username || 'Đầu bếp', username: user?.username || 'chef' };
  }));
}

async function updateBlockedChef(targetUid, shouldBlock) {
  if (!targetUid) throw new Error('Thiếu mã đầu bếp cần chặn.');
  const profile = signedInProfile();
  if (targetUid === profile.uid) throw new Error('Bạn không thể chặn chính mình.');
  if (isFirebaseConfigured() && db) {
    const userRef = doc(db, 'users', profile.uid);
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(userRef);
      if (!snapshot.exists()) throw new Error('Không tìm thấy hồ sơ của bạn.');
      const targetSnapshot = shouldBlock ? await transaction.get(doc(db, 'users', targetUid)) : null;
      if (shouldBlock && !targetSnapshot.exists()) throw new Error('Không tìm thấy đầu bếp này.');
      const currentIds = Array.isArray(snapshot.data().blockedChefIds) ? snapshot.data().blockedChefIds : [];
      const blockedChefIds = toggleBlockedChef(currentIds, targetUid, shouldBlock);
      transaction.set(userRef, { blockedChefIds }, { merge: true });
      profile.blockedChefIds = blockedChefIds;
    });
  } else {
    const users = getMockUsers();
    const index = users.findIndex((user) => user.uid === profile.uid);
    if (index < 0) throw new Error('Không tìm thấy hồ sơ của bạn.');
    if (shouldBlock && !users.some((user) => user.uid === targetUid)) throw new Error('Không tìm thấy đầu bếp này.');
    const currentIds = Array.isArray(users[index].blockedChefIds) ? users[index].blockedChefIds : [];
    users[index].blockedChefIds = toggleBlockedChef(currentIds, targetUid, shouldBlock);
    profile.blockedChefIds = users[index].blockedChefIds;
    saveMockUsers(users);
  }
  return getBlockedChefIds();
}

export async function blockChef(uid) { return updateBlockedChef(uid, true); }
export async function unblockChef(uid) { return updateBlockedChef(uid, false); }

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
  await assertNotBlocked(targetUid);
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
  const currentProfile = getActiveProfileCache();
  const blockedIds = currentProfile?.uid ? await getBlockedIdsForUser(currentProfile.uid) : [];
  let users;
  if (isFirebaseConfigured() && db) {
    const snapshot = await getDocs(query(collection(db, 'users'), where('isOnline', '==', true)));
    users = [];
    snapshot.forEach((userDoc) => users.push({ uid: userDoc.id, ...userDoc.data() }));
  } else {
    users = getMockUsers();
  }
  return filterOnlineChefs(users, blockedIds, currentProfile?.uid, now, ONLINE_WINDOW_MS)
    .map((user) => ({ uid: user.uid, username: user.username || 'chef', displayName: user.displayName || user.username || 'Bếp Trưởng', kitchenName: user.kitchenName || 'Nhà Bếp Sáng Tạo', bio: user.privacySettings?.showBio === false ? '' : (user.bio || ''), gender: user.privacySettings?.showGender === false ? '' : (user.gender && user.gender !== 'unspecified' ? getProfileGenderLabel(user.gender) : ''), followerCount: Number(user.followerCount) || 0, allowKitchenInvites: user.privacySettings?.allowKitchenInvites !== false, allowDirectMessages: user.privacySettings?.allowDirectMessages !== false }))
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
  if (!canViewChefProfile(profile.privacySettings, currentProfile?.uid, profile.uid)) {
    throw new Error('Đầu bếp này đã đặt hồ sơ ở chế độ riêng tư.');
  }
  if (currentProfile?.uid && currentProfile.uid !== profile.uid) await assertNotBlocked(profile.uid);
  return {
    uid: profile.uid,
    username: profile.username || 'chef',
    displayName: profile.displayName || profile.username || 'Bếp Trưởng',
    kitchenName: profile.kitchenName || 'Nhà Bếp Sáng Tạo',
    bio: profile.privacySettings?.showBio === false ? '' : (profile.bio || ''),
    gender: profile.privacySettings?.showGender === false ? '' : (profile.gender && profile.gender !== 'unspecified' ? getProfileGenderLabel(profile.gender) : ''),
    allowKitchenInvites: profile.privacySettings?.allowKitchenInvites !== false,
    allowDirectMessages: profile.privacySettings?.allowDirectMessages !== false,
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
  const invitationRef = isFirebaseConfigured() && db ? doc(db, 'kitchen_invites', inviteId) : null;
  const targetRef = isFirebaseConfigured() && db ? doc(db, 'users', targetUid) : null;
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
    await runTransaction(db, async (transaction) => {
      const senderRef = doc(db, 'users', profile.uid);
      const [targetSnapshot, senderSnapshot, existing] = await Promise.all([transaction.get(targetRef), transaction.get(senderRef), transaction.get(invitationRef)]);
      if (!targetSnapshot.exists()) throw new Error('Không tìm thấy đầu bếp này.');
      if ((senderSnapshot.data()?.blockedChefIds || []).includes(targetUid) || (targetSnapshot.data().blockedChefIds || []).includes(profile.uid)) throw new Error('Không thể gửi lời mời vì có người đã chặn đối phương.');
      if (!canReceiveKitchenInvites(targetSnapshot.data().privacySettings)) throw new Error('Đầu bếp này hiện không nhận lời mời vào bếp.');
      if (existing.exists() && existing.data().status === 'pending') throw new Error('Bạn đã gửi lời mời đang chờ đầu bếp này phản hồi.');
      transaction.set(invitationRef, invitation);
    });
  } else {
    await assertNotBlocked(targetUid);
    if (!canReceiveKitchenInvites(await getPrivacySettingsForUser(targetUid))) throw new Error('Đầu bếp này hiện không nhận lời mời vào bếp.');
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
    const visibleInvites = [];
    for (const invite of invites.values()) {
      const otherUid = invite.senderUid === profile.uid ? invite.recipientUid : invite.senderUid;
      if (!(await isBlockedEitherDirection(otherUid))) visibleInvites.push(invite);
    }
    return visibleInvites.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }
  const visibleInvites = [];
  for (const invite of readLocal().invites.filter((entry) => entry.senderUid === profile.uid || entry.recipientUid === profile.uid)) {
    const otherUid = invite.senderUid === profile.uid ? invite.recipientUid : invite.senderUid;
    if (!(await isBlockedEitherDirection(otherUid))) visibleInvites.push(invite);
  }
  return visibleInvites
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
      const senderRef = doc(db, 'users', snapshot.data().senderUid);
      const [senderSnapshot, recipientSnapshot] = await Promise.all([transaction.get(senderRef), transaction.get(doc(db, 'users', profile.uid))]);
      if ((senderSnapshot.data()?.blockedChefIds || []).includes(profile.uid) || (recipientSnapshot.data()?.blockedChefIds || []).includes(snapshot.data().senderUid)) throw new Error('Không thể xử lý lời mời vì có người đã chặn đối phương.');
      transaction.set(inviteRef, { status: response, respondedAt: new Date().toISOString() }, { merge: true });
      return { ...snapshot.data(), id: snapshot.id, status: response };
    });
  }
  const data = readLocal();
  const invite = data.invites.find((entry) => entry.id === inviteId && entry.recipientUid === profile.uid);
  if (!invite) throw new Error('Không tìm thấy lời mời dành cho bạn.');
  if (invite.status !== 'pending') throw new Error('Lời mời này đã được xử lý.');
  await assertNotBlocked(invite.senderUid);
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
  return getStoredChatMessages(stored, 50);
}

export async function sendDirectMessage(otherUid, text) {
  const profile = signedInProfile();
  if (!otherUid || otherUid === profile.uid) throw new Error('Chọn một đầu bếp khác để trò chuyện.');
  await assertNotBlocked(otherUid);
  if (!canReceiveDirectMessages(await getPrivacySettingsForUser(otherUid))) {
    throw new Error('Đầu bếp này hiện không nhận tin nhắn.');
  }
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
    const messages = getStoredChatMessages(stored, Number.MAX_SAFE_INTEGER);
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
      if (await isBlockedEitherDirection(otherUid)) return null;
      let chef = { uid: otherUid, displayName: data.participantNames?.[otherUid] || 'Đầu bếp', username: 'chef', kitchenName: 'Nhà Bếp Sáng Tạo' };
      try { chef = { ...chef, ...await getChefPublicProfile(otherUid) }; } catch {}
      let allowDirectMessages = true;
      try { allowDirectMessages = (await getPrivacySettingsForUser(otherUid)).allowDirectMessages !== false; } catch {}
      return { ...chef, allowDirectMessages, conversationId: entry.id, lastMessage: data.lastMessage || '', lastSenderUid: data.lastSenderUid || '', updatedAt: data.updatedAt || '' };
    }));
    return conversations.filter(Boolean).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }

  const result = [];
  const users = getMockUsers();
  Object.entries(readLocal().chats).forEach(([conversationId, value]) => {
    const summary = getLocalConversationSummary(conversationId, value, profile.uid, users);
    if (!summary) return;
    const otherUid = summary.uid;
    if (isChefBlocked(profile.blockedChefIds, users.find((user) => user.uid === otherUid)?.blockedChefIds, profile.uid, otherUid)) return;
    result.push(summary);
  });
  return result.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

export { getFollowedFeed } from './social-data.js';
