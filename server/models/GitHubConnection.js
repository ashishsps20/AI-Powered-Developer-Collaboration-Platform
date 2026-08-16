import mongoose from 'mongoose';

const gitHubConnectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // A user should not have duplicate active GitHub connections
    },
    githubUserId: {
      type: String,
      required: true
    },
    githubUsername: {
      type: String,
      required: true
    },
    githubAvatarUrl: {
      type: String
    },
    accessTokenEncrypted: {
      type: String,
      required: true
    },
    refreshTokenEncrypted: {
      type: String
    },
    tokenExpiresAt: {
      type: Date
    },
    scopes: {
      type: [String],
      default: []
    },
    connectedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const GitHubConnection = mongoose.model('GitHubConnection', gitHubConnectionSchema);

export default GitHubConnection;
