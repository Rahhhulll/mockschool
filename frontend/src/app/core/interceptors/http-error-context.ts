import { HttpContextToken } from '@angular/common/http';

export const SKIP_GLOBAL_HTTP_ERROR_NOTIFICATION = new HttpContextToken<boolean>(() => false);
