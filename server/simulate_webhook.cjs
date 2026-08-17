const crypto = require('crypto');
const http = require('http');

const secret = 'my_super_secret_webhook_key_12345'; // from .env
const payload = {
  action: 'closed',
  pull_request: {
    number: 2,
    id: 1, // We need the actual PR id, let's look it up or fake it
    title: 'Clean up README content',
    state: 'closed',
    merged: true,
    html_url: 'https://github.com/ashishsps20/Youtube-frontend-clone-by-html-and-css/pull/2',
    user: { login: 'ashishsps20' },
    head: { ref: 'test-branch' },
    base: { ref: 'main' }
  },
  repository: {
    id: 1, // Need actual repo id
    full_name: 'ashishsps20/Youtube-frontend-clone-by-html-and-css'
  },
  sender: {
    login: 'ashishsps20'
  }
};

async function run() {
  const mongoose = require('mongoose');
  await mongoose.connect('mongodb+srv://ashishsps20_db_user:nBlFw3paXwaJfNSv@cluster0.2s9299y.mongodb.net/dev-collab');
  const db = mongoose.connection.db;
  
  // Find the task link to get the exact IDs
  const link = await db.collection('taskgithublinks').findOne({ githubPullRequestNumber: 2 });
  if (!link) {
    console.log('Could not find task link in DB');
    process.exit(1);
  }
  
  payload.repository.id = link.githubRepositoryId;
  payload.pull_request.id = link.githubPullRequestId;
  
  const bodyString = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret);
  const signature = 'sha256=' + hmac.update(bodyString).digest('hex');
  
  const req = http.request('http://localhost:5000/api/github/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hub-signature-256': signature,
      'x-github-event': 'pull_request',
      'x-github-delivery': 'fake-delivery-id-' + Date.now()
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Response:', res.statusCode, data);
      process.exit(0);
    });
  });
  
  req.write(bodyString);
  req.end();
}

run().catch(console.error);
