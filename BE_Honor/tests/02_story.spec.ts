import { test as base, expect } from '@playwright/test';
import { globalData } from '../utils/globalData';
import { faker } from '@faker-js/faker';

interface Credentials {
  username: string;
  password: string;
  authCookie: string;
}

let story_category_id: string;
let self_guided_group_id: string;
let topic_content_id: string;
const randomStoryName = faker.book.title()
const today = new Date().toLocaleDateString();

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

  test('get connect tab information', async ({ request, credentials }) => {
    const response = await request.get(`${process.env.BASE_URL}/api/categories`, {
      headers: { Cookie: credentials.authCookie },
    });
    const result = await response.json();
    console.log(JSON.stringify(result, null, 2));
    story_category_id= result.results[0].id;
    console.log(story_category_id);
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);
  });

  test('creating a Story', async ({ request, credentials }) => {

    const response = await request.post(`${process.env.BASE_URL}/api/createArticle`, {
      headers: {
        Cookie: credentials.authCookie
      },
      data: {
        name: 'Story Made Through Playwright ' + randomStoryName +' '+ today,
        "categoryIds": [
            story_category_id
          ]
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);
    
    const responseBody = await response.json();
    expect(responseBody.result.name).toEqual('Story Made Through Playwright ' + randomStoryName +' '+ today);

    
    globalData.story_key = responseBody.result.id;
    console.log(globalData.story_key);
  });



  test('ERROR creating a Story with duplicate name', async ({ request, credentials }) => {
    const response = await request.post(`${process.env.BASE_URL}/api/createArticle`, {
      headers: {
        Cookie: credentials.authCookie
      },
      data: {
        name: 'Story Made Through Playwright ' + randomStoryName +' '+ today,
        "categoryIds": [
            story_category_id
          ]
      },
    });
    expect(response.status()).toBe(400);

    const responseBody = await response.json();
    expect(responseBody.error.message).toEqual('The Story name already exists');
  });


  test('changing status to visible', async ({ request, credentials }) => {
    const response = await request.patch(`${process.env.BASE_URL}/api/updateArticle`, {
      headers: {
        Cookie: credentials.authCookie
      },
      data: {
        articleId: globalData.story_key,
        status: 2
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);

    const responseBody = await response.json();
    self_guided_group_id= responseBody.result.contentGroups[0].id;
    expect(responseBody.result.statusValue).toEqual('SHARED')

    //console.log(JSON.stringify(responseBody, null, 2));
  });

  test('adding a narrative to the story', async ({ request, credentials }) => {

    const response = await request.post(`${process.env.BASE_URL}/api/createTopicContent`, {
      headers: {
        Cookie: credentials.authCookie
      },
      data: {
        
        articleId: globalData.story_key,
        topicContentGroupId: self_guided_group_id,
        textEntry: {
          content: "<p dir=\"ltr\"><span>This is a body test</span></p>",
          header: "Example"
        }

      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);

    const responseBody = await response.json();
    topic_content_id = responseBody.result.id;
  });



  test('updating the narrative of the story', async ({ request, credentials }) => {

    const response = await request.patch(`${process.env.BASE_URL}/api/updateTopicContent`, {
      headers: {
        Cookie: credentials.authCookie
      },
      data: {
        topicContentId:topic_content_id,
        textEntry: {
          content: "<p dir=\"ltr\"><u><i><b><strong class=\"rtf-text-italic rtf-text-underline\">This is a body test that was updated by using API</strong></b></i></u></p><p dir=\"ltr\"><i><em class=\"rtf-text-italic\">thanks for testing this</em></i></p>",
          header: "Example Updated"
        }
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);

    const responseBody = await response.json();
    expect(responseBody.result.textEntry.content).toContain('This is a body test that was updated by using API')
  });



  test('creating a short answer for the story', async ({ request, credentials }) => {

    const response = await request.post(`${process.env.BASE_URL}/api/createTopicContent`, {
      headers: {
        Cookie: credentials.authCookie
      },
      data: {
        
        articleId: globalData.story_key,
        topicContentGroupId: self_guided_group_id,
        widget: {
          textInputWidget: {
            prompt: "Short Answer for a story created by Playwright",
            isResponseFromOtherStudentsEnabled: true,
            header: "Short Answer Story Playwright"
          }
        }

      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);

    const responseBody = await response.json();
    topic_content_id = responseBody.result.id;
    expect(responseBody.result.widget.textInputWidget.prompt).toContain("Short Answer for a story created by Playwright");
  });



  test('get story contents information', async ({ request, credentials }) => {
    const response = await request.get(`${process.env.BASE_URL}/api/article?articleId=${globalData.story_key}`, {
      headers: { Cookie: credentials.authCookie },
    });
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);

    const result = await response.json();
    console.log(JSON.stringify(result, null, 2));
  });