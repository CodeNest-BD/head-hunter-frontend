import { z } from "zod";

/**
 * The US address every account carries, as sign-up and every later edit of it
 * accept it. Shared so the three forms that collect an address (sign-up, the
 * company profile, the recruiter profile) cannot drift into different rules —
 * they did once, when sign-up demanded a ZIP+4 shape the profile screens would
 * happily overwrite with anything.
 */
export const addressLineSchema = z
  .string()
  .trim()
  .min(1, "Street address is required")
  .max(200, "Keep it under 200 characters");

export const citySchema = z
  .string()
  .trim()
  .min(1, "City is required")
  .max(120, "Keep it under 120 characters");

/** The state select only ever yields a valid code, so an empty value is the
 * only way here — hence the message reads as a prompt, not a format rule. */
export const stateSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{2}$/, "Select a state");

export const zipSchema = z
  .string()
  .trim()
  .regex(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP or ZIP+4, e.g. 94103");
