import { Service } from './lib/Service.js';

export const SERVICE_URLS = {
  [Service.CAS]: 'https://cas.finki.ukim.mk/cas/login',
  [Service.COURSES]: 'https://courses.finki.ukim.mk/login/index.php',
  [Service.DIPLOMAS]: 'http://diplomski.finki.ukim.mk/Account/LoginCAS',
} as const satisfies Record<Service, string>;
