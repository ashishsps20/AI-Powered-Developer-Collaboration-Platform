import { Channel } from '../models/Channel.js';
import { Message } from '../models/Message.js';
import { ApiError } from '../utils/ApiError.js';
import { assertProjectAccess } from './access.service.js';

export async function listProjectChannels(projectId, user) {
  await assertProjectAccess(projectId, user, 'DEVELOPER');
  return Channel.find({ project: projectId, type: 'PROJECT' }).sort({ createdAt: 1 });
}

export async function createProjectChannel(projectId, user, { name }) {
  await assertProjectAccess(projectId, user, 'PROJECT_MANAGER');
  return Channel.create({
    type: 'PROJECT',
    name,
    project: projectId,
    createdBy: user.id,
  });
}

export async function getOrCreateDmChannel(user, otherUserId) {
  if (user.id === otherUserId) {
    throw new ApiError(400, 'Cannot create a DM channel with yourself');
  }

  let channel = await Channel.findOne({
    type: 'DM',
    participants: { $all: [user.id, otherUserId], $size: 2 },
  });

  if (!channel) {
    channel = await Channel.create({
      type: 'DM',
      participants: [user.id, otherUserId],
      createdBy: user.id,
      name: 'Direct Message',
    });
  }

  return channel;
}

async function assertChannelAccess(channelId, user) {
  const channel = await Channel.findById(channelId);
  if (!channel) throw new ApiError(404, 'Channel not found');

  if (channel.type === 'PROJECT') {
    await assertProjectAccess(channel.project.toString(), user, 'DEVELOPER');
    return channel;
  }

  const isParticipant = channel.participants.some((p) => p.toString() === user.id);
  if (!isParticipant && user.role !== 'ADMIN') {
    throw new ApiError(403, 'You cannot access this channel');
  }
  return channel;
}

export async function listChannelMessages(channelId, user, { limit = 50 } = {}) {
  await assertChannelAccess(channelId, user);
  return Message.find({ channel: channelId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'name email avatar');
}

export async function createMessage(channelId, user, { content }) {
  const channel = await assertChannelAccess(channelId, user);
  const message = await Message.create({
    channel: channel._id,
    sender: user.id,
    content,
    readBy: [user.id],
  });
  return message.populate('sender', 'name email avatar');
}

export async function updateMessage(messageId, user, { content }) {
  const message = await Message.findById(messageId);
  if (!message) throw new ApiError(404, 'Message not found');
  if (message.sender.toString() !== user.id) {
    throw new ApiError(403, 'You can only edit your own messages');
  }
  await assertChannelAccess(message.channel.toString(), user);

  message.content = content;
  message.isEdited = true;
  await message.save();
  return message.populate('sender', 'name email avatar');
}

export async function deleteMessage(messageId, user) {
  const message = await Message.findById(messageId);
  if (!message) throw new ApiError(404, 'Message not found');
  if (message.sender.toString() !== user.id) {
    throw new ApiError(403, 'You can only delete your own messages');
  }
  await assertChannelAccess(message.channel.toString(), user);
  await message.deleteOne();
  return { deleted: true };
}

export async function markMessageRead(messageId, user) {
  const message = await Message.findById(messageId);
  if (!message) throw new ApiError(404, 'Message not found');
  await assertChannelAccess(message.channel.toString(), user);

  if (!message.readBy.some((id) => id.toString() === user.id)) {
    message.readBy.push(user.id);
    await message.save();
  }
  return message;
}

export { assertChannelAccess };
