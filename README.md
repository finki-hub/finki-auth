# FINKI Hub / FINKI Auth

Node.js package for managing authentication and cookies for FCSE's services.

## Features

Currently supports the following services:

- [Anketi](https://anketi.ukim.mk/)
- [CAS](https://cas.finki.ukim.mk/)
- [Consultations](https://consultations.finki.ukim.mk/)
- [Courses](https://courses.finki.ukim.mk/)
- [Diplomas](https://diplomski.finki.ukim.mk/)
- [GitLab](https://gitlab.finki.ukim.mk/)
- [iKnow](https://www.iknow.ukim.mk/)
- [Internships](https://internships.finki.ukim.mk/)
- [Ispiti](https://ispiti.finki.ukim.mk/)
- [Masters](https://magisterski.finki.ukim.mk/)
- [Old Courses](https://oldcourses.finki.ukim.mk/)

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
const valid = await auth.isCookieValid(Service.COURSES);

if (!valid) await auth.authenticate(Service.COURSES);

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

### Authentication behavior

Authentication state is isolated per service. Re-authenticating a service
clears its previous session before starting, including when the new attempt
fails; sessions for other services are unaffected. GitLab performs one extra
validation request to its protected profile endpoint before publishing the
new session. Other services keep their existing login flow and do not perform
an additional mandatory validation request.

## License

This project is licensed under the terms of the MIT license.
