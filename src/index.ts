import dotenv from 'dotenv';
dotenv.config();

import app from './server.js';
import prisma from './config/db.js';

const PORT = process.env.PORT || 3005;

/**
 * =========================
 * START SERVER
 * =========================
 */
const startServer = async () => {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('Database connected successfully');

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Swagger: http://localhost:${PORT}/api-docs`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Server and database connection closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Server and database connection closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();