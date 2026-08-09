export function serializeUser(user) {
  if (!user) return null;
  const doc = user.toObject ? user.toObject() : user;
  return {
    id: doc._id?.toString() || doc.id,
    name: doc.name,
    email: doc.email,
    avatar: doc.avatar || '',
    role: doc.role,
    isVerified: doc.isVerified,
    isActive: doc.isActive,
    lastSeen: doc.lastSeen,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
