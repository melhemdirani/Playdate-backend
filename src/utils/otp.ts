import otpGenerator from 'otp-generator';

export const generateOTP = (length = 4) => {
  return otpGenerator.generate(length, {
    specialChars: false,
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false
  });
};
