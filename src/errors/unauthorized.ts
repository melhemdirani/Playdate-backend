import { StatusCodes } from 'http-status-codes';
import CustomAPIError from './custom-api';

class UnAuthorizedError extends CustomAPIError {
  statusCode: StatusCodes;
  constructor(message: string | undefined) {
    super(message);
    this.statusCode = StatusCodes.FORBIDDEN;
  }
}

export default UnAuthorizedError;
