// FoalTS
import { ValidateFunction } from 'ajv';
import { Context, Hook, HookDecorator, HttpResponseBadRequest, ServiceManager } from '../../core';
import { OpenApi } from '../../core/openapi';
import { ApiParameter, ApiResponse, IApiCookieParameter } from '../../openapi';
import { getAjvInstance } from '../utils';
import { isFunction } from './is-function.util';

/**
 * Hook - Validate a specific cookie against an AJV schema.
 *
 * @export
 * @param {string} name - Cookie name.
 * @param {(object | ((controller: any) => object))} [schema={ type: 'string' }] - Schema used to
 * validate the cookie.
 * @param {{ openapi?: boolean, required?: boolean }} [options={}] - Options.
 * @param {boolean} [options.openapi] - Add OpenApi metadata.
 * @param {boolean} [options.required] - Specify is the cookie is optional.
 * @returns {HookDecorator} The hook.
 */
export function ValidateCookie(
  name: string,
  schema: object | ((controller: any) => object) = { type: 'string' } ,
  options: { openapi?: boolean, required?: boolean } = {}
): HookDecorator {
  const required = options.required !== false;

  let validateSchema: ValidateFunction|undefined;

  function validate(this: any, ctx: Context, services: ServiceManager) {
    if (!validateSchema) {
      const ajvSchema = isFunction(schema) ? schema(this) : schema;
      const components = services.get(OpenApi).getComponents(this);

      validateSchema = getAjvInstance().compile({
        components,
        properties: {
          [name]: ajvSchema
        },
        required: required ? [ name ] : [],
        type: 'object',
      });
    }

    if (!validateSchema(ctx.request.cookies)) {
      return new HttpResponseBadRequest({ cookies: validateSchema.errors });
    }
  }

  const param: IApiCookieParameter = { in: 'cookie', name };
  if (required) {
    param.required = required;
  }

  const openapi = [
    ApiParameter((c: any) => ({
      ...param,
      schema: isFunction(schema) ? schema(c) : schema
    })),
    ApiResponse(400, { description: 'Bad request.' })
  ];

  return Hook(validate, openapi, options);
}
