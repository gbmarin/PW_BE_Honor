import { test as base, expect } from '@playwright/test';
import { globalData} from '../utils/globalData';

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


  test.skip('delete story ', async ({ request, credentials }) => {
    const response = await request.delete(`${process.env.BASE_URL}/api/deleteArticle`, {
      headers: {
        Cookie: credentials.authCookie
      },
      data: {
        articleId: globalData.story_key
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);
  });

test.skip('delete course ', async ({ request, credentials }) => {
    const response = await request.delete(`${process.env.BASE_URL}/api/deleteCourse`, {
      headers: {
        Cookie: credentials.authCookie
      },
      data: {
        courseId: globalData.course_key 
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);
  });