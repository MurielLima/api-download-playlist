
class AppError{
  public readonly message: string;
  public readonly statusCode: number;
  public readonly detail: any[];
  constructor(message: string, statusCode = 400, detail : any[] = []) {
    this.message = message;
    this.statusCode = statusCode;
    this.detail = detail;
  }
}

export default AppError;
