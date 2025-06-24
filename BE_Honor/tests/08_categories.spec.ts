import { test as base, expect } from '@playwright/test';
import { globalData } from '../utils/globalData';

interface Credentials {
  username: string;
  password: string;
  authCookie: string;
}

// Define an array to store created category IDs
let categoryKeys: string[] = [];

// Set up the test with credentials
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

// Create three categories
test('create multiple categories', async ({ request, credentials }) => {
  const categoryNames = ["Category A", "Category B", "Category C"];
  
  for (const name of categoryNames) {
    const response = await request.post(`${process.env.BASE_URL}/api/createCourseCategory`, {
      headers: {
        Cookie: credentials.authCookie,
      },
      data: {
        name,
        courseId: globalData.course_key,
      },
    });
    
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);

    const responseBody = await response.json();
    categoryKeys.push(responseBody.result.id);
  }
  console.log(`Created categories: ${categoryKeys}`);
});


test('ERROR creating a category with the same name', async ({ request, credentials }) => {
  const categoryDuplicate = "Category A";
    const response = await request.post(`${process.env.BASE_URL}/api/createCourseCategory`, {
      headers: {
        Cookie: credentials.authCookie,
      },
      data: {
        name: categoryDuplicate,
        courseId: globalData.course_key,
      },
    });
    
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    const responseBody = await response.json();
    expect(responseBody.error.message).toEqual('Another category with the same name already exists')


});


// Rename each category
test('rename multiple categories', async ({ request, credentials }) => {
  const renamedCategories = ["Renamed Category A", "Renamed Category B", "Renamed Category C"];
  
  for (let i = 0; i < categoryKeys.length; i++) {
    const response = await request.patch(`${process.env.BASE_URL}/api/renameCourseCategory`, {
      headers: {
        Cookie: credentials.authCookie,
      },
      data: {
        name: renamedCategories[i],
        categoryId: categoryKeys[i],
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);
  }
  console.log("Renamed categories successfully");
});

// Verify the current order of categories
test('view categories available', async ({ request, credentials }) => {
    const response = await request.patch(`${process.env.BASE_URL}/api/updateCourseCategoryOrder`, {
      headers: {
        Cookie: credentials.authCookie
      },
      data: {
            courseId: globalData.course_key
      },
    });
    const responseBody = await response.json();
    // Confirm categories are retrieved in order
    categoryKeys = responseBody.result.categoryOrder;
    console.log(`Current category order: ${categoryKeys}`);
  });

// Reorder categories
test.skip('change categories order', async ({ request, credentials }) => {
  const reversedOrder = [...categoryKeys].reverse();
  
  const response = await request.patch(`${process.env.BASE_URL}/api/updateCourseCategoryOrder`, {
    headers: {
      Cookie: credentials.authCookie,
    },
    data: {
      courseId: globalData.course_key,
      categoryOrder: reversedOrder,
    },
  });
  
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  console.log("Category order has been reversed.");
});
