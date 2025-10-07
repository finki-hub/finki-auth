import { z } from 'zod';

export enum Service {
  CAS = 'cas',
  COURSES = 'courses',
  DIPLOMAS = 'diplomas',
  INTERNSHIPS = 'internships',
  MASTERS = 'masters',
  OLD_COURSES = 'old_courses',
}

export const ServiceSchema = z.enum(Service);
