declare module "serialijse" {
    export type IgnoreSpec = string | RegExp

    export interface SerializeContext {
      index: any[],
      objects: any[]
    }

    export interface SerializeOptions {
        ignored?: IgnoreSpec[]|IgnoreSpec
        errorHandler?: (context: SerializeContext, options: SerializeOptions, object: any, _throw: () => any) => any;
    }

    export function serialize<T>(object: T, options?: SerializeOptions): string;

    export function deserialize<T>(serializationString: string): T;

    export function declarePersistable(constructor: any, name?: string): void;

    export function serializeZ<T>(obj: T, callback: (err: string, buff: any) => void): void;
    export function serializeZ<T>(obj: T, options: object, callback: (err: string, buff: any) => void): void;

    export function deserializeZ<T>(buff: any, callback: (err: string, obj: T) => void): void;
}
