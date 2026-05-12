import { z } from 'zod';

export enum Service {
  CAS = 'cas',
  CONSULTATIONS = 'consultations',
  COURSES = 'courses',
  DIPLOMAS = 'diplomas',
  GITLAB = 'gitlab',
  IKNOW = 'iknow',
  INTERNSHIPS = 'internships',
  ISPITI = 'ispiti',
  MASTERS = 'masters',
  OLD_COURSES = 'old_courses',
}

export const ServiceSchema = z.enum(Service);
