import { clear } from '../test_helpers/other';
import { adminAuthLogin, adminAuthRegister } from '../test_helpers/auth';
import { adminQuizCreate } from '../test_helpers/quiz';

describe('DELETE /clear', () => {
  beforeEach(() => {
    clear();
  });

  test('no added users', () => {
    expect(clear()).toStrictEqual({});
  });

  test('one added user', () => {
    adminAuthRegister('abc@def.com', "Insecure D0n't know what f0r!", 'Abra', 'Kadabra');
    expect(clear()).toStrictEqual({});
    expect(adminAuthLogin('abc@def.com', "Insecure D0n't know what f0r!").statusCode)
      .toStrictEqual(400);
  });

  test('multiple added users', () => {
    adminAuthRegister('abc@def.com', "Insecure D0n't know what f0r!", 'Abra', 'Kadabra');
    adminAuthRegister('abcg@def.com', "Insecure Dn't know what f0r!", 'Abrag', 'Kadabrag');
    expect(clear()).toStrictEqual({});
    expect(adminAuthLogin('abc@def.com', "Insecure D0n't know what f0r!").statusCode)
      .toStrictEqual(400);
  });

  test('one added quiz', () => {
    const session = adminAuthRegister('abc@def.com', "Insecure D0n't know what f0r!",
      'Abra', 'Kadabra').session;
    adminQuizCreate(session, 'Quiz 1', 'This is Quiz 1');
    expect(clear()).toStrictEqual({});
    expect(adminAuthLogin('abc@def.com', "Insecure D0n't know what f0r!").statusCode)
      .toStrictEqual(400);
  });

  test('multiple added quizzes', () => {
    const session = adminAuthRegister('abc@def.com', "Insecure D0n't know what f0r!",
      'Abra', 'Kadabra').session;
    adminQuizCreate(session, 'Quiz 1', 'This is Quiz 1');
    adminQuizCreate(session, 'Quiz 2', 'This is Quiz 2');
    expect(clear()).toStrictEqual({});
    expect(adminAuthLogin('abc@def.com', "Insecure D0n't know what f0r!").statusCode)
      .toStrictEqual(400);
  });

  test('multiple users and one quiz', () => {
    const session = adminAuthRegister('abc@def.com', "Insecure D0n't know what f0r!",
      'Abra', 'Kadabra').session;
    adminAuthRegister('abcg@def.com', "Insecure Dn't know what f0r!", 'Abrag', 'Kadabrag');
    adminQuizCreate(session, 'Quiz 1', 'This is Quiz 1');
    expect(clear()).toStrictEqual({});
    expect(adminAuthLogin('abc@def.com', "Insecure D0n't know what f0r!").statusCode)
      .toStrictEqual(400);
  });

  test('multiple users and multiple quizzes', () => {
    const session = adminAuthRegister('abc@def.com', "Insecure D0n't know what f0r!",
      'Abra', 'Kadabra').session;
    const session2 = adminAuthRegister('abcg@def.com', "Insecure Dn't know what f0r!",
      'Abrag', 'Kadabrag').session;
    adminQuizCreate(session, 'Quiz 1', 'This is Quiz 1');
    adminQuizCreate(session2, 'Quiz 2', 'This is Quiz 2');
    expect(clear()).toStrictEqual({});
    expect(adminAuthLogin('abc@def.com', "Insecure D0n't know what f0r!").statusCode)
      .toStrictEqual(400);
  });
});
