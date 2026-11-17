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
