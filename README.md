# AI-Powered Developer Collaboration & Project Management Platform

## Technology Stack
- Node.js
- Express.js
- MongoDB
- Mongoose

## Folder Structure
- `client/` - Frontend application (to be implemented)
- `server/` - Backend application
  - `config/` - Configuration files like database connection
  - `middleware/` - Custom middleware
  - `routes/` - API routes
  - `app.js` - Express configuration
  - `server.js` - Server entry point
- `.env` - Environment variables (ignored by Git)
- `.env.example` - Example environment variables

## Backend Setup
1. Navigate to the `server` directory: `cd server`
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure your environment variables.
4. Ensure MongoDB is running on your machine (e.g. locally at `mongodb://localhost:27017/dev-collab`).

## Environment Variables
- `MONGO_URI`: MongoDB connection string
- `PORT`: The port the backend should listen on
- `CLIENT_URL`: URL of the frontend for CORS
- `NODE_ENV`: Application environment (`development` or `production`)

## Running the Server
In the `server` directory:
- **Development**: `npm run dev` (starts server with nodemon)
- **Production**: `npm start` (starts server with node)

## API Endpoints
- `GET /` - Root endpoint
- `GET /api/health` - Health check endpoint
