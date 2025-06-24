import { test as base, expect } from '@playwright/test';
import { globalData } from '../utils/globalData';

interface Credentials {
  username: string;
  password: string;
  authCookie: string;
}

let materials_topic_key: string;
let content_group_id: string;

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


test('create topic for prompts', async ({ request, credentials }) => {
    const response = await request.post(`${process.env.BASE_URL}/api/createTopic`, {
      headers: {
        Cookie: credentials.authCookie
      },
      data: {
        title: "Materials Topic from Playwright",
        courseId: globalData.course_key,
        status: "SHARED"
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);
    const responseBody = await response.json();
    materials_topic_key = responseBody.result.id;
  });



test('view prompt topic contents ', async ({ request, credentials }) => {
    const response = await request.get(`${process.env.BASE_URL}/api/topic?topicId=${materials_topic_key}`, {
      headers: {
        Cookie: credentials.authCookie
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);
    const responseBody = await response.json();
    content_group_id = responseBody.result.contentGroups[0].id;
    globalData.category_key = responseBody.result.categoryId;
  });

  test('reorder topics ', async ({ request, credentials }) => {
    const response = await request.get(`${process.env.BASE_URL}/api/topic?topicId=${materials_topic_key}`, {
      headers: {
        Cookie: credentials.authCookie
      },
      data:{
            topicId: materials_topic_key,
            position: 1
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);
  });

  
  test('create web link material', async ({ request, credentials }) => {
    const response = await request.post(`${process.env.BASE_URL}/api/createTopicContent`, {
      headers: {
        Cookie: credentials.authCookie
      },
      data: {
        topicId: materials_topic_key,
        topicContentGroupId: content_group_id,
        webLink: {
          webAddress: "https://google.com",
          caption: "Weblink for Testing",
          header: "Web Link Created by Playwright"
        }
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);
  });


  test('create narrative material', async ({ request, credentials }) => {
    const response = await request.post(`${process.env.BASE_URL}/api/createTopicContent`, {
      headers: {
        Cookie: credentials.authCookie
      },
      data: {
        topicId: materials_topic_key,
        topicContentGroupId: content_group_id,
        textEntry: {
        content: "<p dir=\"ltr\"><u><i><b><strong class=\"rtf-text-italic rtf-text-underline\">This is a body test that was updated by using API</strong></b></i></u></p><p dir=\"ltr\"><i><em class=\"rtf-text-italic\">thanks for testing this</em></i></p>",
          header: "Example Updated for a Course"
        }
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);
  });
