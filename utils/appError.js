class AppError extends Error  {
  constructor () {
    super();
  }
  create(httpStatusText, message, statusCode) {
    this.message = message;
    this.statusCode = statusCode;
    this.httpStatusText = httpStatusText;
    return this;
  }
}

export default new AppError()
