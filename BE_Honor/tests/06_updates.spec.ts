import { test as base, expect } from '@playwright/test';
import { globalData, addMonthsWithValidDate } from '../utils/globalData';

interface Credentials {
  username: string;
  password: string;
  authCookie: string;
}

let course_update_key: string, story_update_key: string;

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

test('creating an update key for a course', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/createInstructorAnnouncement`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      courseId: globalData.course_key,
      textEntry: {
        header: "",
        content: ""
      }
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  const responseBody = await response.json();
  course_update_key = responseBody.result.id;
});


test('creating a draft for a course', async ({ request, credentials }) => {
  const response = await request.patch(`${process.env.BASE_URL}/api/updateInstructorAnnouncement`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      updateId: course_update_key,
      textEntry: {
        header: "",
        content: "<p dir=\"ltr\"><span>DRAFT from PLAYWRIGHT </span></p>"
      },
      assetIds: []
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
});

test('publish an update for a course', async ({ request, credentials }) => {
  const response = await request.patch(`${process.env.BASE_URL}/api/updateInstructorAnnouncement`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      updateId: course_update_key,
      textEntry: {
        header: "",
        content: "<p dir=\"ltr\"><span>UPDATE sent directly from PLAYWRIGHT testing</span></p>"
      },
      status: 2,
      assetIds: []
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
});



test('creating an update key for a story', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/createInstructorAnnouncement`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      articleId: globalData.story_key,
      textEntry: {
        header: "",
        content: ""
      }
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  const responseBody = await response.json();
  story_update_key = responseBody.result.id;
});


test('creating a draft for a story', async ({ request, credentials }) => {
  const response = await request.patch(`${process.env.BASE_URL}/api/updateInstructorAnnouncement`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      updateId: story_update_key,
      textEntry: {
        header: "",
        content: "<p dir=\"ltr\"><span>DRAFT from PLAYWRIGHT </span></p>"
      },
      assetIds: []
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
});



test('publish an update for a story', async ({ request, credentials }) => {
  const response = await request.patch(`${process.env.BASE_URL}/api/updateInstructorAnnouncement`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      updateId: story_update_key,
      textEntry: {
        header: "",
        content: "<p dir=\"ltr\"><span>UPDATE sent directly from PLAYWRIGHT testing</span></p>"
      },
      status: 2,
      assetIds: []
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
});