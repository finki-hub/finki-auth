import type { CookieJar } from 'tough-cookie';

import 'axios';

declare module 'axios' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface AxiosRequestConfig {
    jar?: CookieJar;
  }
}
