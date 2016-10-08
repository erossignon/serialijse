declare module "serialijse" {
	export function serialize<T>(object: T): string;
	export function deserialize<T>(serializationString: string): T;
	export function declarePersistable(constructor: any): void;
    export function serializeZ<T>(obj: T, callback: (err: string, buff: any) => void): void;
    export function deserializeZ<T>(buff: any, callback: (err: string, obj: T) => void): void;
}
