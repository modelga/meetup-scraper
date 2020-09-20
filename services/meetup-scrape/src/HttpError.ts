export default class HttpError {
  constructor(public readonly code: number, public readonly message: string) {}
}
