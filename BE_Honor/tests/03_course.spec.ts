import { test as base, expect } from '@playwright/test';
import { globalData, addMonthsWithValidDate} from '../utils/globalData';

interface Credentials {
  username: string;
  password: string;
  authCookie: string;
}
let prompts_topic_key: string;
let content_group_id: string;
let short_answer_prompt_key: string;
let file_upload_prompt_key: string;
let quick_poll_prompt_key: string;
let knowledge_check_prompt_key: string;
const today = new Date();
const formattedDate = today.toISOString().split('T')[0];
const oneMonthAhead = addMonthsWithValidDate(today,1)
const twoMonthsAhead = addMonthsWithValidDate(today,2)
const threeMonthsAhead = addMonthsWithValidDate(today,3)



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

test('creating a course', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/createCourse`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      courseIdentifier: "test-api-playwright",
      courseName: "Test API Playwright Course",
      status: "SHARED"
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  const responseBody = await response.json();
  globalData.course_key = responseBody.result.id;
});


test('setting a course schedule', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/createCourseSchedule`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      courseId: globalData.course_key ,
      startDate: formattedDate,
      endDate: twoMonthsAhead
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  const responseBody = await response.json()
  expect(responseBody.result.startDate).toEqual(formattedDate)
  expect(responseBody.result.endDate).toEqual(twoMonthsAhead)
});

test('editing a course general info', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/editCourse`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      courseId: globalData.course_key ,
      courseIdentifier: "test-api-playwright-re",
      courseName: "Test API Playwright Renamed " + formattedDate,
      startDate: formattedDate,
      endDate: threeMonthsAhead
    },
  });
  expect(response.status()).toBe(200);
  const responseBody = await response.json();
  expect(responseBody.result.courseName).toBe("Test API Playwright Renamed " + formattedDate);
  expect(responseBody.result.status).not.toBe("HIDDEN");
});


test('create topic for prompts', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/createTopic`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      title: "Topic Prompts from Playwright",
      courseId: globalData.course_key,
      status: "SHARED"
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  const responseBody = await response.json();
  prompts_topic_key = responseBody.result.id;
});


test('view prompt topic contents ', async ({ request, credentials }) => {
  const response = await request.get(`${process.env.BASE_URL}/api/topic?topicId=${prompts_topic_key}`, {
    headers: {
      Cookie: credentials.authCookie
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  const responseBody = await response.json();
  content_group_id = responseBody.result.contentGroups[0].id;
  globalData.category_key = responseBody.result.categoryId;
  console.log('CATEGORY ID: '+globalData.category_key);
});

test('create topic schedule ', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/createTopicSchedule`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      topicId: prompts_topic_key,
      dueDate: oneMonthAhead
    },
  });
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);
    const responseBody = await response.json();
    expect(responseBody.result.dueDate).toEqual(oneMonthAhead)
});

test('set topic to locked ', async ({ request, credentials }) => {
  const response = await request.patch(`${process.env.BASE_URL}/api/updateTopic`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      topicId: prompts_topic_key,
      status: 'OUTLINED'
    },
  });
  const responseBody = await response.json();
  expect(responseBody.result.status).toBe('OUTLINED');
});

test('create short answer prompt ', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/createTopicContent`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      topicId: prompts_topic_key,
      topicContentGroupId: content_group_id,
      widget: {
        textInputWidget: {
          prompt: "Short Answer created through PLAYWRIGHT",
          isResponseFromOtherStudentsEnabled: true,
          header: "Short Answer created through PLAYWRIGHT"
        }
      }
    },
  });
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);
    const responseBody = await response.json();
    short_answer_prompt_key = responseBody.result.id;
});

test('update short answer prompt ', async ({ request, credentials }) => {
  const response = await request.patch(`${process.env.BASE_URL}/api/updateTopicContent`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      topicContentId: short_answer_prompt_key,
      widget: {
        textInputWidget: {
          prompt: "UPDATED Short Answer through PLAYWRIGHT",
          isResponseFromOtherStudentsEnabled: true,
          header: "UPDATED Short Answer through PLAYWRIGHT"
        }
      },
      topicId: prompts_topic_key
    },
  });
    const responseBody = await response.json();
    //console.log(JSON.stringify(responseBody, null, 2));
    expect(responseBody.result.widget.textInputWidget.header).toBe("UPDATED Short Answer through PLAYWRIGHT");
});

test('create file upload prompt ', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/createTopicContent`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      topicId: prompts_topic_key,
      topicContentGroupId: content_group_id,
      widget: {
        fileUploadWidget: {
          prompt: "File Upload Playwright",
          isResponseFromOtherStudentsEnabled: true,
          header: "File Upload Playwright"
        }
      }
    },
  });
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);
    const responseBody = await response.json();
    file_upload_prompt_key = responseBody.result.id;
});

test('update file upload prompt ', async ({ request, credentials }) => {
  const response = await request.patch(`${process.env.BASE_URL}/api/updateTopicContent`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      topicContentId: file_upload_prompt_key,
      widget: {
        fileUploadWidget: {
          prompt: "File Upload Playwright UPDATED",
          isResponseFromOtherStudentsEnabled: true,
          header: "File Upload Playwright UPDATED"
        }
      },
      topicId: prompts_topic_key
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
});


test('create quick poll prompt ', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/createTopicContent`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      topicId: prompts_topic_key,
      topicContentGroupId: content_group_id,
      widget: {
        quickPollWidget: {
          header: "Quick Poll created through PLAYWRIGHT",
          prompt: "Quick Poll created through PLAYWRIGHT",
          isResponseFromOtherStudentsEnabled: true,
          options: [
            {
              text: "a"
            },
            {
              text: "b"
            },
            {
              text: "c"
            },
            {
              text: "d"
            }
          ]
        }
      }
    },
  });
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);
    const responseBody = await response.json();
    quick_poll_prompt_key = responseBody.result.id;
});

test('update quick poll prompt ', async ({ request, credentials }) => {
  const response = await request.patch(`${process.env.BASE_URL}/api/updateTopicContent`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
          topicContentId: quick_poll_prompt_key,
        widget: {
          quickPollWidget: {
          header: "Quick Poll updated through PLAYWRIGHT",
          prompt: "Quick Poll updated through PLAYWRIGHT",
          isResponseFromOtherStudentsEnabled: true,
          isMultipleSelectionEnabled: false,
          options: [
            {
              text: "A Option"
            },
            {
              text: "B Option"
            },
            {
              text: "C Option"
            }
          ]
        }
      },
      topicId: prompts_topic_key
        },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
});

test('create knowledge check prompt ', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/createTopicContent`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      topicId: prompts_topic_key,
      topicContentGroupId: content_group_id,
      knowledgeCheck: {
        title: "this is a knowledge check",
        description: "this is a random description",
        questions: [
          {
            text: "<p dir=\"ltr\"><span>text only question</span></p><p dir=\"ltr\"><br></p>",
            type: "MULTIPLE-CHOICE",
            answers: [
              {
                text: "a option",
                isCorrect: true
              },
              {
                text: "b option",
                isCorrect: false
              }
            ]
          }
        ]
      }
    },
  });
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);
    const responseBody = await response.json();
    knowledge_check_prompt_key = responseBody.result.id;
});

test('update knowledge check prompt ', async ({ request, credentials }) => {
  const response = await request.patch(`${process.env.BASE_URL}/api/updateTopicContent`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      topicContentId: knowledge_check_prompt_key,
  knowledgeCheck: {
    title: "this is a knowledge check",
    description: "this is a random description",
    questions: [
      {
        text: "<p dir=\"ltr\"><span>text only question</span></p><p><br></p>",
        type: "MULTIPLE-CHOICE",
        answers: [
          {
            text: "a option",
            isCorrect: true
          },
          {
            text: "b option",
            isCorrect: false
          }
        ]
      },
      {
        text: "<p dir=\"ltr\"><span>adding an extra question</span></p><p dir=\"ltr\"><br></p>",
        type: "MULTIPLE-CHOICE",
        answers: [
          {
            text: "a option",
            isCorrect: true
          },
          {
            text: "b option",
            isCorrect: false
          },
          {
            text: "c option",
            isCorrect: false
          },
          {
            text: "d option",
            isCorrect: false
          }
        ]
      }
    ]
  },
  "topicId": prompts_topic_key
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
});


