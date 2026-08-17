import { RegisterDetails } from '../pages/RegisterPage';

export function generateRandomUser(): RegisterDetails {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  return {
    gender: 'male',
    firstName: 'Test',
    lastName: 'Automation',
    email: `test.user.${timestamp}.${randomNum}@example.com`,
    password: 'TestPassword123!',
  };
}
