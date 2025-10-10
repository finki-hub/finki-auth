# FINKI Auth

Node.js package for managing authentication and cookies for FCSE's services, built using [axios](https://github.com/axios/axios).

## Features

Currently supports the following services:

- [CAS](https://cas.finki.ukim.mk/)
- [Courses](https://courses.finki.ukim.mk/)
- [Diplomas](https://diplomski.finki.ukim.mk/)
- [Old Courses](https://oldcourses.finki.ukim.mk/)
- [Masters](https://magisterski.finki.ukim.mk/)
- [Internships](https://internships.finki.ukim.mk/)
- [Consultations](https://consultations.finki.ukim.mk/)

## Installation

You can add the package to your NPM project by running `npm i finki-auth`.

## Example

```ts
import {
  CasAuthentication,
  Service,
  isCookieValid,
  isCookieHeaderValid,
} from "finki-auth";

const credentials = {
  username: "example",
  password: "secret_password",
};

const auth = new CasAuthentication(credentials);

await auth.authenticate(Service.COURSES);

// Get array of cookie objects
const cookies = await auth.getCookie(Service.COURSES);

// Get cookie header directly for sending requests
const cookieHeader = await auth.buildCookieHeader(Service.COURSES);

// Check if the cookie is still valid, and if not, call `authenticate` again
const isCookieValid = await auth.isCookieValid(Service.COURSES);

if (!isCookieValid) await auth.authenticate(Service.COURSES);

// There are also some utility functions available:
const isCookieValidStandalone = await isCookieValid({
  service: Service.COURSES,
  cookies,
});

const isCookieHeaderValidStandalone = await isCookieHeaderValid({
  service: Service.COURSES,
  cookieHeader,
});
```

## License

This project is licensed under the terms of the MIT license.
