import { z } from 'zod';

export enum Service {
  CAS = 'cas',
  COURSES = 'courses',
  DIPLOMAS = 'diplomas',
  MASTERS = 'masters',
  OLD_COURSES = 'old_courses',
}

export const ServiceSchema = z.enum(Service);
