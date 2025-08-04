import { z } from 'zod';

export enum Service {
  CAS = 'cas',
  COURSES = 'courses',
  DIPLOMAS = 'diplomas',
}

export const ServiceSchema = z.enum(Service);
