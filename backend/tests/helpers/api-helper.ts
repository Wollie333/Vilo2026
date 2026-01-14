/**
 * API Test Helper
 * Provides convenient wrapper functions for making API requests in tests
 */

import request from 'supertest';
import express from 'express';

// This will be imported from your main app file
// For now, we'll create a placeholder
let app: express.Application;

/**
 * Initialize the test app
 * Call this in beforeAll() of your test suite
 */
export function initTestApp(testApp: express.Application) {
  app = testApp;
}

/**
 * Helper class for making authenticated API requests
 */
export class ApiClient {
  private authToken?: string;

  constructor(authToken?: string) {
    this.authToken = authToken;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string) {
    this.authToken = token;
    return this;
  }

  /**
   * GET request
   */
  get(url: string, query?: Record<string, any>) {
    const req = request(app).get(url);

    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }

    if (query) {
      req.query(query);
    }

    return req;
  }

  /**
   * POST request
   */
  post(url: string, data?: any) {
    const req = request(app)
      .post(url)
      .send(data);

    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }

    return req;
  }

  /**
   * PATCH request
   */
  patch(url: string, data?: any) {
    const req = request(app)
      .patch(url)
      .send(data);

    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }

    return req;
  }

  /**
   * PUT request
   */
  put(url: string, data?: any) {
    const req = request(app)
      .put(url)
      .send(data);

    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }

    return req;
  }

  /**
   * DELETE request
   */
  delete(url: string) {
    const req = request(app).delete(url);

    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }

    return req;
  }
}

/**
 * Create an authenticated API client
 */
export function createAuthenticatedClient(authToken: string): ApiClient {
  return new ApiClient(authToken);
}

/**
 * Create an unauthenticated API client
 */
export function createClient(): ApiClient {
  return new ApiClient();
}

/**
 * Utility function to expect a successful response
 */
export function expectSuccess(response: request.Response, statusCode: number = 200) {
  expect(response.status).toBe(statusCode);
  expect(response.body).toBeDefined();
  return response.body;
}

/**
 * Utility function to expect an error response
 */
export function expectError(response: request.Response, statusCode: number, message?: string) {
  expect(response.status).toBe(statusCode);
  if (message) {
    expect(response.body.error || response.body.message).toContain(message);
  }
  return response.body;
}

/**
 * Utility function to expect validation errors
 */
export function expectValidationError(response: request.Response, field?: string) {
  expect(response.status).toBe(400);
  expect(response.body.errors || response.body.error).toBeDefined();
  if (field) {
    const errors = response.body.errors || [];
    expect(errors.some((err: any) => err.field === field || err.path?.includes(field))).toBe(true);
  }
  return response.body;
}
