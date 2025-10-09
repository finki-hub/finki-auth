import { Service } from './lib/Service.js';

export const SERVICE_URLS = {
  [Service.CAS]: 'https://cas.finki.ukim.mk/cas',
  [Service.CONSULTATIONS]: 'https://consultations.finki.ukim.mk',
  [Service.COURSES]: 'https://courses.finki.ukim.mk',
  [Service.DIPLOMAS]: 'http://diplomski.finki.ukim.mk',
  [Service.INTERNSHIPS]: 'https://internships.finki.ukim.mk',
  [Service.MASTERS]: 'https://magisterski.finki.ukim.mk',
  [Service.OLD_COURSES]: 'https://oldcourses.finki.ukim.mk',
} as const satisfies Record<Service, string>;

export const SERVICE_LOGIN_URLS = {
  [Service.CAS]: 'https://cas.finki.ukim.mk/cas/login',
  [Service.CONSULTATIONS]: 'https://consultations.finki.ukim.mk/consultations',
  [Service.COURSES]: 'https://courses.finki.ukim.mk/login/index.php',
  [Service.DIPLOMAS]: 'http://diplomski.finki.ukim.mk/Account/LoginCAS',
  [Service.INTERNSHIPS]: 'https://internships.finki.ukim.mk/login',
  [Service.MASTERS]: 'https://magisterski.finki.ukim.mk/login',
  [Service.OLD_COURSES]: 'https://oldcourses.finki.ukim.mk/login/index.php',
} as const satisfies Record<Service, string>;

export const SERVICE_SUCCESS_SELECTORS = {
  [Service.CAS]: 'div.success',
  [Service.CONSULTATIONS]: 'a#username',
  [Service.COURSES]: 'span.usertext.me-1',
  [Service.DIPLOMAS]: '#logoutForm > ul > li:nth-child(1) > a',
  [Service.INTERNSHIPS]: 'span.me-2',
  [Service.MASTERS]: 'li > a > span',
  [Service.OLD_COURSES]: 'span.usertext.mr-1',
} as const satisfies Record<Service, string>;
