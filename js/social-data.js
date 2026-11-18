/** Pure helpers shared by the community social service and its tests. */
export function toggleMember(members, uid) {
  const uniqueMembers = [...new Set(Array.isArray(members) ? members.filter(Boolean) : [])];
  const liked = uniqueMembers.includes(uid);
  return {
    members: liked ? uniqueMembers.filter((member) => member !== uid) : [...uniqueMembers, uid],
    active: !liked
  };
}

export function getFollowingIds(value) {
  if (Array.isArray(value)) return [...new Set(value.filter(Boolean))];
  if (value && typeof value === 'object') return Object.keys(value).filter((uid) => value[uid]);
  return [];
}

export function normalizePrivacySettings(settings = {}) {
  return {
    profileVisibility: settings.profileVisibility === 'private' ? 'private' : 'public',
    showOnlineStatus: settings.showOnlineStatus !== false,
    showGender: settings.showGender !== false,
    showBio: settings.showBio !== false,
    allowKitchenInvites: settings.allowKitchenInvites !== false,
    allowDirectMessages: settings.allowDirectMessages !== false
  };
}

export function canViewChefProfile(privacySettings, viewerUid, profileUid) {
  return privacySettings?.profileVisibility !== 'private' || viewerUid === profileUid;
}

export function canReceiveKitchenInvites(privacySettings) {
  return privacySettings?.allowKitchenInvites !== false;
}

export function canReceiveDirectMessages(privacySettings) {
  return privacySettings?.allowDirectMessages !== false;
}

export function getChefRecipes(posts, chefUid) {
  return (Array.isArray(posts) ? posts : []).filter((post) => post?.chefUid === chefUid);
}

export function normalizeSearchText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi').trim();
}

function matchesSearchFields(fields, query) {
  const normalizedQuery = normalizeSearchText(query).replace(/^@/, '');
  return !normalizedQuery || fields.some((field) => normalizeSearchText(field).includes(normalizedQuery));
}

export function matchesOnlineChefSearch(chef, query) {
  return matchesSearchFields([chef?.username, chef?.displayName, chef?.kitchenName], query);
}

export function matchesCommunityRecipeSearch(recipe, query) {
  return matchesSearchFields([recipe?.headingTitle, recipe?.chefUsername, recipe?.chefDisplayName, recipe?.kitchenName], query);
}

export function filterBlockedRecipes(posts, blockedChefIds) {
  const blocked = new Set(getFollowingIds(blockedChefIds));
  return (Array.isArray(posts) ? posts : []).filter((post) => !blocked.has(post?.chefUid));
}

export function getPostLikeState(post, viewerUid) {
  const likedBy = getFollowingIds(post?.likedBy);
  const count = Number(post?.likeCount);
  return {
    liked: Boolean(viewerUid && likedBy.includes(viewerUid)),
    likeCount: Number.isFinite(count) && count >= 0 ? count : likedBy.length
  };
}

export function getStoredChatMessages(stored, maxMessages = 50) {
  const messages = Array.isArray(stored) ? stored : stored?.messages;
  return Array.isArray(messages) ? messages.slice(-maxMessages) : [];
}

export function getLocalConversationSummary(conversationId, stored, currentUid, users = []) {
  const messages = getStoredChatMessages(stored, Number.MAX_SAFE_INTEGER);
  const participants = Array.isArray(stored?.participants)
    ? stored.participants
    : [...new Set(messages.map((message) => message.senderUid).filter(Boolean))];
  const otherUid = participants.find((uid) => uid !== currentUid);
  if (!otherUid) return null;
  const other = users.find((user) => user.uid === otherUid) || {};
  const lastMessage = messages[messages.length - 1];
  return {
    uid: otherUid,
    username: other.username || 'chef',
    displayName: other.displayName || lastMessage?.senderName || 'Đầu bếp',
    kitchenName: other.kitchenName || 'Nhà Bếp Sáng Tạo',
    allowDirectMessages: other.privacySettings?.allowDirectMessages !== false,
    conversationId,
    lastMessage: Array.isArray(stored) ? (lastMessage?.text || '') : (stored?.lastMessage || lastMessage?.text || ''),
    lastSenderUid: Array.isArray(stored) ? (lastMessage?.senderUid || '') : (stored?.lastSenderUid || lastMessage?.senderUid || ''),
    updatedAt: Array.isArray(stored) ? (lastMessage?.createdAt || '') : (stored?.updatedAt || lastMessage?.createdAt || '')
  };
}

export function isChefBlocked(blockedByCurrent, blockedByOther, currentUid, otherUid) {
  if (!currentUid || !otherUid || currentUid === otherUid) return false;
  return getFollowingIds(blockedByCurrent).includes(otherUid)
    || getFollowingIds(blockedByOther).includes(currentUid);
}

export function toggleBlockedChef(blockedIds, targetUid, shouldBlock = true) {
  if (!targetUid) throw new Error('Thiếu mã đầu bếp cần chặn.');
  const current = getFollowingIds(blockedIds);
  return shouldBlock
    ? [...new Set([...current, targetUid])]
    : current.filter((uid) => uid !== targetUid);
}

export function filterBlockedChefs(chefs, blockedByCurrent, currentUid) {
  const blocked = new Set(getFollowingIds(blockedByCurrent));
  return (Array.isArray(chefs) ? chefs : []).filter((chef) => chef?.uid
    && chef.uid !== currentUid
    && !blocked.has(chef.uid)
    && !isChefBlocked([], chef.blockedChefIds, currentUid, chef.uid));
}

export function filterOnlineChefs(chefs, blockedByCurrent, currentUid, now = Date.now(), maxAgeMs = 120_000) {
  return filterBlockedChefs(chefs, blockedByCurrent, currentUid).filter((chef) =>
    chef.isBanned !== true
    && canViewChefProfile(chef.privacySettings, currentUid, chef.uid)
    && chef.privacySettings?.showOnlineStatus !== false
    && chef.isOnline === true
    && isPresenceFresh(chef.lastSeenAt, now, maxAgeMs));
}

export function getFollowedFeed(posts, followingIds) {
  const following = new Set(getFollowingIds(followingIds));
  return (Array.isArray(posts) ? posts : []).filter((post) => following.has(post?.chefUid));
}

export function isPresenceFresh(lastSeenAt, now = Date.now(), maxAgeMs = 120_000) {
  const timestamp = typeof lastSeenAt === 'number' ? lastSeenAt : Date.parse(lastSeenAt);
  return Number.isFinite(timestamp) && timestamp <= now && now - timestamp <= maxAgeMs;
}

export function getConversationId(firstUid, secondUid) {
  if (!firstUid || !secondUid || firstUid === secondUid) throw new Error('Cuộc trò chuyện cần hai tài khoản khác nhau.');
  return [firstUid, secondUid].sort().map((uid) => encodeURIComponent(uid)).map((uid) => `${uid.length}_${uid}`).join('');
}

export function normalizeChatMessage(text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Tin nhắn không được để trống.');
  const message = text.trim();
  if (message.length > 1000) throw new Error('Tin nhắn không được vượt quá 1000 ký tự.');
  return message;
}
