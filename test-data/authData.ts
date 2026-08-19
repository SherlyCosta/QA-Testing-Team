import dotenv from 'dotenv';
dotenv.config();

export const authData = {
  invalidUser: {
    email: 'nonexistent_qa_user_9999@example.com',
    password: 'InvalidPassword123!',
  },
  existingUser: {
    get email() {
      return process.env.TEST_USER_EMAIL || 'qa.playwright.demo@example.com';
    },
  },
};
