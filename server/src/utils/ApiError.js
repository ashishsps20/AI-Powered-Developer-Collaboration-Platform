export const PLATFORM_ROLES = ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'];

export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
