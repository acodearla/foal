// std
import { ok, strictEqual, throws } from 'assert';

// FoalTS
import {
  Context,
  getHookFunction,
  HookFunction,
  HttpResponse,
  HttpResponseForbidden,
  HttpResponseRedirect,
  HttpResponseUnauthorized,
  ServiceManager,
} from '../../../core';
import { PermissionRequired } from './permission-required.hook';
import { IUserWithPermissions } from './user-with-permissions.interface';

describe('PermissionRequired', () => {

  let preHook: HookFunction;

  class User implements IUserWithPermissions {
    constructor(private readonly permissions: string[]) {}

    hasPerm(codeName: string): boolean {
      return this.permissions.includes(codeName);
    }
  }

  before(() => {
    preHook = getHookFunction(PermissionRequired('bar'));
  });

  it('should return an HttpResponseUnauthorized if the user is not authenticated.', () => {
    const ctx = new Context({});
    const actual = preHook(ctx, new ServiceManager());
    ok(actual instanceof HttpResponseUnauthorized);
  });

  it('should return an HttpResponseRedirect if the user is not authenticated'
      + ' and a redirect path was given.', () => {
    const preHook = getHookFunction(PermissionRequired('bar', { redirect: '/login' }));

    const ctx = new Context({});
    const actual = preHook(ctx, new ServiceManager());
    ok(actual instanceof HttpResponseRedirect);
    strictEqual((actual as HttpResponseRedirect).path, '/login');
  });

  it('should throw an error if the user instance does NOT have a "hasPerm" method.', () => {
    const ctx = new Context({});
    ctx.user = {};

    throws(
      () => preHook(ctx, new ServiceManager()),
      new Error('ctx.user does not have a "hasPerm" method. Are you sure it implements the IUserWithPermissions interface?')
    );
  });

  it('should return an HttpResponseForbidden if the user does not have the required permission.', () => {
    const permission = 'foo';

    const ctx = new Context({});
    ctx.user = new User([ permission ]);

    const actual = preHook(ctx, new ServiceManager());
    ok(actual instanceof HttpResponseForbidden);
  });

  it('should not return any HttpResponse if the user is authenticated and has the required permission.', () => {
    const permission = 'bar';

    const ctx = new Context({});
    ctx.user = new User([ permission ]);

    const actual = preHook(ctx, new ServiceManager());
    strictEqual(actual instanceof HttpResponse, false);
  });

});
