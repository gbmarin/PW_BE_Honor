import { test as base, expect } from '@playwright/test';

interface Credentials {
  username: string;
  password: string;
  authCookie: string;
}

const test = base.extend<{ credentials: Credentials }>({
  credentials: async ({ request }, use) => {
    const username = process.env.USERNAME!; 
    const password = process.env.PASSWORD!;
    const response = await request.post(`${process.env.BASE_URL}/api/login`, {
      data: { username, password },
    });
    const cookies = response.headers()['set-cookie'];

    if (cookies) {
      const authCookie = cookies.split(';')[0];
      await use({ username, password, authCookie });
    } else {
      throw new Error('Authentication failed: No cookie received.');
    }
  },
});

test('check mail API', async ({ request, credentials }) => {
  const checkmail = `${process.env.BASE_URL}/api/checkEmail`;
  const requestPayload = { email: credentials.username };
  const response = await request.post(checkmail, { data: requestPayload });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
});

test('check login', async ({ request, credentials }) => {
  const login = `${process.env.BASE_URL}/api/login`;
  const requestPayload = {
    password: credentials.password,
    username: credentials.username,
  };
  const response = await request.post(login, { data: requestPayload });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
});

test('forgot password', async ({ request, credentials }) => {
  const forgotPassword = `${process.env.BASE_URL}/api/forgotPassword`;
  const requestPayload = {
    email: credentials.username,
    validationUrl: `${process.env.BASE_URL}/validate/forgot`,
  };
  const response = await request.post(forgotPassword, { data: requestPayload });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
});

test('change password', async ({ request, credentials }) => {
  const changePassword = `${process.env.BASE_URL}/api/changePassword`;
  const requestPayload = {
    password: process.env.PASSWORD!,
    oldPassword: process.env.OLD_PASSWORD!,
    accessToken: credentials.authCookie,
  };
  const response = await request.post(changePassword, { data: requestPayload });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
});

test('get user information in Honor Create', async ({ request, credentials }) => {
  const response = await request.get(`${process.env.BASE_URL}/api/user`, {
    headers: { Cookie: credentials.authCookie },
  });
  const result = await response.json();
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
});

test('get courses tab information', async ({ request, credentials }) => {
  const response = await request.get(`${process.env.BASE_URL}/api/courses?endpoint=instructor`, {
    headers: { Cookie: credentials.authCookie },
  });
  const result = await response.json();
  console.log(JSON.stringify(result, null, 2));
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
});