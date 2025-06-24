import { test as base, expect } from '@playwright/test';
import { globalData } from '../utils/globalData';

interface Credentials {
  username: string;
  password: string;
  authCookie: string;
}

interface Role {
  id: string;
  name: string;
}

interface JsonData {
  content: Role[];  // 'content' is an array of roles
}

const desiredRoles: string[] = ["Assistant", "Viewer", "Creator"];
const roleIds: { [key: string]: string } = {};

let assistant_role_id: string | undefined, 
    viewer_role_id: string | undefined, 
    creator_role_id: string | undefined;



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

test('get role information', async ({ request, credentials }) => {
  // Fetch roles from the API
  const response = await request.get(`${process.env.BASE_URL}/api/roles?courseId=${globalData.course_key}`, {
    headers: { Cookie: credentials.authCookie },
  });

  const responseBody: JsonData = await response.json();

  // Ensure 'content' is a valid array
  const roles: Role[] = responseBody.content || [];

  if (!Array.isArray(roles)) {
    throw new Error('Invalid response structure: roles not found');
  }

  // Loop through the desired roles and map their IDs
  for (const roleName of desiredRoles) {
    const foundRole = roles.find(role => role.name === roleName);
    if (foundRole) {
      roleIds[roleName] = foundRole.id;
    } else {
      console.warn(`Role "${roleName}" not found in responseBody`);
    }
  }

  // Assign role IDs
  assistant_role_id = roleIds.Assistant;
  viewer_role_id = roleIds.Viewer;
  creator_role_id = roleIds.Creator;

  // Assert the response status is in the 2xx range
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);

  // Ensure all required roles were found, or throw an error
  if (!assistant_role_id || !viewer_role_id || !creator_role_id) {
    throw new Error('One or more role IDs could not be retrieved');
  }
});


test('setting a collaborator creator to the course', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/addCollaborator`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      courseId: globalData.course_key,
      accessorId: process.env.CREATOR_ID,
      roleId: creator_role_id,
      accessLevel: "WRITE"
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
});


test('setting an assistant to the course', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/addCollaborator`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      courseId: globalData.course_key,
      accessorId: process.env.ASSISTANT_ID,
      roleId: assistant_role_id,
      accessLevel: "WRITE"
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
});

test('setting a viewer to the course', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/addCollaborator`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      courseId: globalData.course_key,
      accessorId: process.env.VIEWER_ID,
      roleId: viewer_role_id,
      accessLevel: "WRITE"
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
});

test('changing a viewer to a creator', async ({ request, credentials }) => {
  const response = await request.post(`${process.env.BASE_URL}/api/editCollaborator`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
      courseId: globalData.course_key,
      userTenantId: process.env.VIEWER_ID,
      roleId: creator_role_id,
      accessLevel: "WRITE"
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
});

test('deleting a collaborator', async ({ request, credentials }) => {
  const response = await request.delete(`${process.env.BASE_URL}/api/deleteCollaborator`, {
    headers: {
      Cookie: credentials.authCookie
    },
    data: {
        userTenantId: process.env.VIEWER_ID,
        courseId: globalData.course_key
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
});