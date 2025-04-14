import { Service } from './lib/Service.js';

export const SERVICE_URLS = {
  [Service.CAS]: 'https://cas.finki.ukim.mk',
  [Service.COURSES]: 'https://courses.finki.ukim.mk',
  [Service.DIPLOMAS]: 'http://diplomski.finki.ukim.mk',
} as const satisfies Record<Service, string>;

export const SERVICE_LOGIN_URLS = {
  [Service.CAS]: 'https://cas.finki.ukim.mk/cas/login',
  [Service.COURSES]: 'https://courses.finki.ukim.mk/login/index.php',
  [Service.DIPLOMAS]: 'http://diplomski.finki.ukim.mk/Account/LoginCAS',
} as const satisfies Record<Service, string>;

export const SERVICE_USER_ELEMENT_SELECTORS = {
  [Service.CAS]: '',
  [Service.COURSES]: 'span.usertext.mr-1',
  [Service.DIPLOMAS]: '#logoutForm > ul > li:nth-child(1) > a',
} as const satisfies Record<Service, string>;
