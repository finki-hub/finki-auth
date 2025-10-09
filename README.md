# FINKI Auth

NPM (Node) package for managing authentication and sessions for FCSE CAS and the other services. Uses an HTTP client under the hood, and not a full browser (such as Puppeteer).

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
import { CasAuthentication, Service } from "finki-auth";

const auth = new CasAuthentication(credentials.username, credentials.password);
const rawCookies = await auth.authenticate(Service.COURSES);

const cookies: Record<string, string> = {};

for (const { key, value } of rawCookies) {
  cookies[key] = value;
}
```

## License

This project is licensed under the terms of the MIT license.
