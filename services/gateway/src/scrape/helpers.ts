import { AxiosError } from "axios";

export function isAxiosError(err: any): err is AxiosError {
  return err.isAxiosError;
}
export type Dictionary = { [key: string]: undefined };
export function reduceToRemoveErrors(acc: Dictionary, key: string) {
  acc[key] = undefined;
  return acc;
}
