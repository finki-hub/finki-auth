import { Service } from './lib/Service.js';

export const SERVICE_URLS = {
  [Service.ANKETI]: 'https://anketi.ukim.mk',
  [Service.CAS]: 'https://cas.finki.ukim.mk/cas',
  [Service.CONSULTATIONS]: 'https://consultations.finki.ukim.mk',
  [Service.COURSES]: 'https://courses.finki.ukim.mk',
  [Service.DIPLOMAS]: 'http://diplomski.finki.ukim.mk',
  [Service.GITLAB]: 'https://gitlab.finki.ukim.mk',
  [Service.IKNOW]: 'https://www.iknow.ukim.mk',
  [Service.INTERNSHIPS]: 'https://internships.finki.ukim.mk',
  [Service.ISPITI]: 'https://ispiti.finki.ukim.mk',
  [Service.MASTERS]: 'https://magisterski.finki.ukim.mk',
  [Service.OLD_COURSES]: 'https://oldcourses.finki.ukim.mk',
} as const satisfies Record<Service, string>;

export const SERVICE_LOGIN_URLS = {
  [Service.ANKETI]: 'https://anketi.ukim.mk',
  [Service.CAS]: 'https://cas.finki.ukim.mk/cas/login',
  [Service.CONSULTATIONS]: 'https://consultations.finki.ukim.mk/consultations',
  [Service.COURSES]: 'https://courses.finki.ukim.mk/login/index.php',
  [Service.DIPLOMAS]: 'http://diplomski.finki.ukim.mk/Account/LoginCAS',
  [Service.GITLAB]: 'https://gitlab.finki.ukim.mk/users/sign_in',
  [Service.IKNOW]: 'https://www.iknow.ukim.mk',
  [Service.INTERNSHIPS]: 'https://internships.finki.ukim.mk/login',
  [Service.ISPITI]: 'https://ispiti.finki.ukim.mk/login/index.php',
  [Service.MASTERS]: 'https://magisterski.finki.ukim.mk/login',
  [Service.OLD_COURSES]: 'https://oldcourses.finki.ukim.mk/login/index.php',
} as const satisfies Record<Service, string>;

export const SERVICE_SUCCESS_SELECTORS = {
  [Service.ANKETI]: 'a[href="/MicrosoftIdentity/Account/SignOut"]',
  [Service.CAS]: 'div.success',
  [Service.CONSULTATIONS]: 'a#username',
  [Service.COURSES]: 'span.usertext.me-1',
  [Service.DIPLOMAS]: '#logoutForm > ul > li:nth-child(1) > a',
  [Service.GITLAB]: 'aside.super-sidebar',
  [Service.IKNOW]: 'a#ctl00_ctl00_lnkLogOut',
  [Service.INTERNSHIPS]: 'span.text-white',
  [Service.ISPITI]: 'span.usertext.me-1',
  [Service.MASTERS]: 'li > a > span',
  [Service.OLD_COURSES]: 'span.usertext.mr-1',
} as const satisfies Record<Service, string>;

export const GITLAB_LDAP_CALLBACK_URL =
  'https://gitlab.finki.ukim.mk/users/auth/ldapmain/callback';

export const IKNOW_CAS_SERVICE_URL =
  'https://is.iknow.ukim.mk/account/logincas';

export const ANKETI_SIGN_IN_URL =
  'https://anketi.ukim.mk/MicrosoftIdentity/Account/SignIn';
