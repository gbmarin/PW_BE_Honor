import { test as base, expect } from '@playwright/test';
import { globalData, addMonthsWithValidDate } from '../utils/globalData';

interface Credentials {
  username: string;
  password: string;
  authCookie: string;
}

let short_answer_assessment_key: string;
let file_upload_assessment_key: string;
let external_sub_assessment_key: string;
let quiz_assessment_key: string;

const today = new Date();
const oneMonthAhead = addMonthsWithValidDate(today,1)

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


test('creating a short answer assessment', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/createAssessment`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      name: "Short Answer API CREATED",
      courseId: globalData.course_key,
      completionType: "SHORT-ANSWER",
      description: "Short Answer API CREATED",
      dueDate: oneMonthAhead,
      topicIds: [],
      assetIds: [],
      categoryId: globalData.category_key
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  const responseBody = await response.json();
  short_answer_assessment_key = responseBody.result.id;
  expect(responseBody.result.dueDate).toEqual(oneMonthAhead)
});

test('updating a short answer assessment', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/updateAssessment`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
        assessmentId: short_answer_assessment_key,
        status: "SHARED"
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  const responseBody = await response.json();
  expect(responseBody.result.status).toEqual('SHARED')
});

test('creating a file upload assessment', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/createAssessment`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      name: "File Upload API CREATED",
      courseId: globalData.course_key,
      completionType: "FILE-UPLOAD",
      description: "File Upload API CREATED",
      dueDate: oneMonthAhead,
      topicIds: [],
      assetIds: [],
      categoryId: globalData.category_key
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  const responseBody = await response.json();
  file_upload_assessment_key = responseBody.result.id;
});

test('updating a file upload assessment', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/updateAssessment`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
        assessmentId: file_upload_assessment_key,
        status: "OUTLINED"
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  const responseBody = await response.json();
  expect(responseBody.result.status).toEqual('OUTLINED')
});

test('creating a external submission assessment', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/createAssessment`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      name: "External Submission API CREATED",
      courseId: globalData.course_key,
      completionType: "EXTERNAL",
      description: "External Submission API CREATED",
      dueDate: oneMonthAhead,
      topicIds: [],
      assetIds: [],
      link: "https://google.com",
      categoryId: globalData.category_key
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  const responseBody = await response.json();
  external_sub_assessment_key = responseBody.result.id;
});


test('updating a external submission assessment', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/updateAssessment`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
        assessmentId: external_sub_assessment_key,
        status: "HIDDEN"
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  const responseBody = await response.json();
  expect(responseBody.result.status).toEqual('HIDDEN')
});

test('creating a quiz assessment', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/createAssessment`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      name: "Quiz API CREATED",
      courseId: globalData.course_key,
      completionType: "IN-APP",
      categoryId: globalData.category_key
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  const responseBody = await response.json();
  quiz_assessment_key = responseBody.result.id;
});