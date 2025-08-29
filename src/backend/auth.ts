// Import isEmail, isNumeric and isAlpha from validator.js
import { isEmail } from 'validator';

// Import helper functions from helper.ts
import {
  isName,
  containsNumber,
  containsLetter,
  checkName,
  checkEmail,
  checkPassword,
  hash
} from './helper';

// Import getData and setData functions from dataStore.ts
import { getData, setData } from './dataStore';

// Import interface from interface.ts
import { EmptyObject, UserDetail } from './interface';

// Import uuidv4 from uuid
import { v4 as uuidv4 } from 'uuid';

// Import errors from handler.ts
import { RegisterError, SessionError, InputError } from './handler';

/**
 * Register a user with an email, password, and names,
 * then return their session token.
 *
 * @param {string} email - Email id of new user
 * @param {string} password - Password for new user
 * @param {string} nameFirst - First name for new user
 * @param {string} nameLast - Last name for new user
 *
 * @returns {session: string} - session token for the registered user
 * or a specific error message
 */
function adminAuthRegister(
  email: string,
  password: string,
  nameFirst: string,
  nameLast: string
): { session: string } {
  const data = getData();

  // Email validation
  const emailCheck = checkEmail(email);
  if (!emailCheck) {
    throw new RegisterError('Email is invalid');
  }

  // Password validation
  const passwordCheck = checkPassword(password);
  if (!passwordCheck) {
    throw new RegisterError('Password is invalid');
  }

  // First name validation
  const firstNameCheck = checkName(nameFirst);
  if (!firstNameCheck) {
    throw new RegisterError('First name is invalid');
  }

  // Last name validation
  const lastNameCheck = checkName(nameLast);
  if (!lastNameCheck) {
    throw new RegisterError('Last name is invalid');
  }

  const userId = data.users.length;
  const previousPasswords: string[] = [];
  const user = {
    userId: userId,
    email: email,
    nameFirst: nameFirst,
    nameLast: nameLast,
    password: hash(password),
    numSuccessfulLogins: 1,
    numFailedPasswordsSinceLastLogin: 0,
    previousPasswords: previousPasswords,
  };

  const sessionId = uuidv4();

  const session = {
    session: sessionId,
    userId: userId,
  };

  data.users.push(user);
  data.sessions.push(session);
  setData(data);
  return { session: sessionId };
}

/**
 * Takes in information about an admin user to determine if they can log in to
 * manage quizzes
 *
 * @param {string} email - The email of the user
 * @param {string} password - The user's password
 *
 * @returns {{ session: string }} The session token for the logged
 * in user
 */
function adminAuthLogin(
  email: string,
  password: string
): { session: string } {
  const data = getData();

  const user = data.users.find((user) => user.email === email);
  if (!user) {
    // Cannot find the user
    throw new RegisterError('Email does not exist');
  }

  if (user.password !== hash(password)) {
    // Update numFailedPasswordsSinceLastLogin if password is incorrect
    user.numFailedPasswordsSinceLastLogin++;
    setData(data);
    throw new RegisterError('Password is not correct for the given email');
  }

  // Update the details if login is successful
  user.numSuccessfulLogins++;
  user.numFailedPasswordsSinceLastLogin = 0;
  setData(data);

  // Uses uuid to generate a unique sessionId
  const session = uuidv4();
  data.sessions.push({ session, userId: user.userId });
  setData(data);

  return { session };
}

/**
 * Logs out an active admin user.
 *
 * @param {string} session - The sessionId of the user thats logged in
 *
 * @returns { EmptyObject } Empty object or Error object
 */
function adminAuthLogout(session: string): EmptyObject {
  const data = getData();

  const userSession = data.sessions.find(
    (userSession) => userSession.session === session
  );
  if (!userSession) {
    throw new SessionError('Session does not exist');
  }

  data.sessions = data.sessions.filter(
    (userSession) => userSession.session !== session
  );
  setData(data);

  return {};
}

/**
 * Given an admin user's session token, return details about the user.
 *
 * @param {string} session - The session token for the logged in user
 *
 * @returns { {user: UserDetail} } - The details for the logged in user or a specific error message
 */
function adminUserDetails(
  session: string
): { user: UserDetail } {
  const data = getData();

  const userSession = data.sessions.find(
    (sessObj) => sessObj.session === session
  );
  if (!userSession) {
    throw new SessionError('Session is invalid or does not exist');
  }

  const user = data.users.find((user) => user.userId === userSession.userId);

  return {
    user: {
      userId: user.userId,
      name: `${user.nameFirst} ${user.nameLast}`,
      email: user.email,
      numSuccessfulLogins: user.numSuccessfulLogins,
      numFailedPasswordsSinceLastLogin: user.numFailedPasswordsSinceLastLogin,
    },
  };
}

/**
 * Updates the password details of an admin user.
 *
 * @param {string} session - The session token of the logged in user.
 * @param {string} oldPassword - Old password of the user.
 * @param {string} newPassword - New password of the user.
 * @returns {EmptyObject | ErrorObject} - an empty object or an error message
 */

function adminUserPasswordUpdate(
  session: string,
  oldPassword: string,
  newPassword: string
): EmptyObject {
  const data = getData();

  const sessionObj = data.sessions.find(s => s.session === session);
  if (!sessionObj) {
    throw new SessionError('Invalid session');
  }

  const userId = sessionObj.userId;
  const user = data.users.find(u => u.userId === userId);

  if (user.password !== hash(oldPassword)) {
    throw new InputError('Old password is not correct');
  }

  if (oldPassword === newPassword) {
    throw new InputError('New password must be different from the old password');
  }

  if (user.previousPasswords.includes(hash(newPassword))) {
    throw new InputError('Password has been used before');
  }

  if (newPassword.length < 8) {
    throw new InputError('Password must be at least 8 characters long');
  }

  if (!containsLetter(newPassword) || !containsNumber(newPassword)) {
    throw new InputError('Password must contain at least one letter and one number');
  }

  user.previousPasswords.push(user.password);
  user.password = hash(newPassword);

  setData(data);
  return {};
}

/**
 * Given an admin user's session token and a set of properties, update the properties
 * of this logged in admin user.
 *
 * @param {string} session - The session token of the logged in user
 * @param {string} email - A given user's email
 * @param {string} nameFirst - A given user's first name
 * @param {string} nameLast - A given user's last name
 *
 * @returns {EmptyObject | ErrorObject} - an empty object or an error message
 */

function adminUserDetailsUpdate(
  session: string,
  email: string,
  nameFirst: string,
  nameLast: string
): EmptyObject {
  const data = getData();

  const userSession = data.sessions.find(sess => sess.session === session);
  if (!userSession) {
    throw new SessionError('Invalid session token');
  }

  const userId = userSession.userId;
  const user = data.users.find(user => user.userId === userId);

  if (!isEmail(email)) {
    throw new InputError('Email does not satisfy validator.isEmail');
  }

  const existingUser = data.users.find(
    u => u.email === email && u.userId !== userId
  );
  if (existingUser) {
    throw new InputError('Email is currently used by another user');
  }

  if (nameFirst.length < 2 || nameFirst.length > 20 || !isName(nameFirst)) {
    throw new InputError('NameFirst is invalid');
  }

  if (nameLast.length < 2 || nameLast.length > 20 || !isName(nameLast)) {
    throw new InputError('NameLast is invalid');
  }

  user.email = email;
  user.nameFirst = nameFirst;
  user.nameLast = nameLast;

  setData(data);
  return {};
}

export {
  adminAuthRegister,
  adminAuthLogin,
  adminAuthLogout,
  adminUserDetails,
  adminUserPasswordUpdate,
  adminUserDetailsUpdate,
};
