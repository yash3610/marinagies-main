# MarineAegis MERN

MarineAegis is an autonomous maritime cyber-defense and intelligence platform built with React, JavaScript, Express, and MongoDB. The frontend contains 29 standalone React pages while preserving the original visual design, CSS, assets, responsive behavior, and animation system.

## Structure

- client/ - Vite, React, React Router, standalone JSX pages, shared layouts, original CSS/assets, and animation integration
- server/ - Express, MongoDB/Mongoose, JWT authentication, service-request, contact, newsletter, and public API endpoints

## Local setup

1. Copy server/.env.example to server/.env.
2. Start MongoDB locally or set MONGODB_URI to a MongoDB Atlas connection.
3. Run npm install.
4. Run npm run dev.

Frontend: http://localhost:5173
API: http://localhost:5000/api

## Commands

- npm run dev - client and server together
- npm run dev:client - React client only
- npm run dev:server - Express API only
- npm run build - production frontend build
- npm start - production API, serving client/dist when available