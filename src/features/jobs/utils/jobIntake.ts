import type {
  Benefits,
  CompanyDetails,
  JobFormValues,
  JobIntake,
} from "../schemas";

/** The intake groups the job form owns. Everything else in the blob is written
 * by other surfaces and must survive an edit here untouched. */
type FormOwnedIntake = Pick<
  JobFormValues,
  | "companyDetails"
  | "workModel"
  | "onsiteDaysPerWeek"
  | "worksiteAddress"
  | "worksiteZip"
  | "benefitsSummary"
  | "selectionKeys"
  | "positionOpenReason"
  | "confidentialSearch"
  | "daysAndHours"
  | "reportsTo"
  | "benefits"
  | "timelineToHire"
  | "mustHave"
  | "niceToHave"
  | "interviewRounds"
  | "interviewingAsap"
  | "interviewingFrom"
  | "interviewingTo"
  | "postedOnline"
  | "otherSourcing"
>;

/** The intake keys this form re-derives on every save. */
const FORM_OWNED_KEYS = [
  "companyDetails",
  "workModel",
  "onsiteDaysPerWeek",
  "worksiteAddress",
  "worksiteZip",
  "benefitsSummary",
  "selectionKeys",
  "positionOpenReason",
  "confidentialSearch",
  "daysAndHours",
  "reportsTo",
  "benefits",
  "offerTimeline",
  "qualifications",
  "interviewProcess",
  "interviewingAvailability",
  "postedOnlineElsewhere",
  "otherSourcing",
] as const;

const orUndefined = (value: string): string | undefined =>
  value.trim() === "" ? undefined : value.trim();

/** A stored number as the form's string input holds it; absent reads as "". */
const numberToInput = (value: number | undefined): string =>
  value === undefined ? "" : String(value);

/** A typed count as the API wants it — omitted rather than sent as NaN. */
const inputToNumber = (value: string): number | undefined =>
  value.trim() === "" ? undefined : Number(value);

/**
 * The API requires all four company-detail fields once the object is sent at
 * all, so a half-filled block is withheld rather than rejected on save.
 */
function toCompanyDetailsInput(
  values: FormOwnedIntake["companyDetails"],
): CompanyDetails | undefined {
  const industry = orUndefined(values.industry);
  const employeeSize = orUndefined(values.employeeSize);
  const revenue = orUndefined(values.revenue);
  const yearsInBusiness = orUndefined(values.yearsInBusiness);
  if (
    industry === undefined ||
    employeeSize === undefined ||
    revenue === undefined ||
    yearsInBusiness === undefined
  ) {
    return undefined;
  }
  return {
    industry,
    employeeSize,
    revenue,
    yearsInBusiness: Number(yearsInBusiness),
  };
}

/** True when the company ticked or typed anything at all in the benefits block. */
function hasBenefits(values: FormOwnedIntake["benefits"]): boolean {
  return (
    values.medical ||
    values.dental ||
    values.vision ||
    values.sickTime ||
    values.vacation ||
    values.retirement401k ||
    values.ancillary ||
    values.ancillaryDetails.trim() !== "" ||
    values.educationReimbursement ||
    values.vacationDays.trim() !== "" ||
    values.sickDays.trim() !== ""
  );
}

function toBenefitsInput(values: FormOwnedIntake["benefits"]): Benefits {
  return {
    medical: values.medical,
    dental: values.dental,
    vision: values.vision,
    sickTime: values.sickTime,
    vacation: values.vacation,
    ancillary: values.ancillary,
    ancillaryDetails: orUndefined(values.ancillaryDetails),
    educationReimbursement: values.educationReimbursement,
    vacationDays: inputToNumber(values.vacationDays),
    sickDays: inputToNumber(values.sickDays),
    retirement401k: {
      offered: values.retirement401k,
      // Only meaningful alongside an offer, and only when a figure was given.
      matchPercent:
        values.retirement401k && values.retirement401kMatch.trim() !== ""
          ? Number(values.retirement401kMatch)
          : undefined,
    },
  };
}

/** The form's view of an existing job's intake, for `defaultValues`. */
export function intakeToFormValues(intake: JobIntake | null): FormOwnedIntake {
  const benefits = intake?.benefits;
  const availability = intake?.interviewingAvailability;
  return {
    // Older jobs predate the three-state control: an existing `isRemote` is the
    // only signal, and nothing was ever hybrid before now.
    workModel: intake?.workModel ?? "on_site",
    onsiteDaysPerWeek: numberToInput(intake?.onsiteDaysPerWeek),
    worksiteZip: intake?.worksiteZip ?? "",
    benefitsSummary: intake?.benefitsSummary ?? "",
    selectionKeys: intake?.selectionKeys ?? [],
    positionOpenReason: intake?.positionOpenReason ?? "",
    confidentialSearch: intake?.confidentialSearch ?? false,
    companyDetails: {
      industry: intake?.companyDetails?.industry ?? "",
      employeeSize: intake?.companyDetails?.employeeSize ?? "",
      revenue: intake?.companyDetails?.revenue ?? "",
      yearsInBusiness:
        intake?.companyDetails === undefined
          ? ""
          : String(intake.companyDetails.yearsInBusiness),
    },
    worksiteAddress: intake?.worksiteAddress ?? "",
    daysAndHours: intake?.daysAndHours ?? "",
    reportsTo: intake?.reportsTo ?? "",
    benefits: {
      medical: benefits?.medical ?? false,
      dental: benefits?.dental ?? false,
      vision: benefits?.vision ?? false,
      sickTime: benefits?.sickTime ?? false,
      vacation: benefits?.vacation ?? false,
      retirement401k: benefits?.retirement401k.offered ?? false,
      retirement401kMatch:
        benefits?.retirement401k.matchPercent === undefined
          ? ""
          : String(benefits.retirement401k.matchPercent),
      ancillary: benefits?.ancillary ?? false,
      ancillaryDetails: benefits?.ancillaryDetails ?? "",
      educationReimbursement: benefits?.educationReimbursement ?? false,
      vacationDays: numberToInput(benefits?.vacationDays),
      sickDays: numberToInput(benefits?.sickDays),
    },
    timelineToHire: intake?.offerTimeline ?? "",
    mustHave: intake?.qualifications?.mustHave ?? [],
    niceToHave: intake?.qualifications?.niceToHave ?? [],
    interviewRounds: (intake?.interviewProcess ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((stage) => ({
        type: stage.type,
        durationMinutes: String(stage.durationMinutes),
      })),
    // Unstated availability reads as ASAP-unset rather than a phantom date range.
    interviewingAsap: availability?.asap ?? false,
    interviewingFrom: availability?.from ?? "",
    interviewingTo: availability?.to ?? "",
    postedOnline:
      intake?.postedOnlineElsewhere === undefined
        ? ""
        : intake.postedOnlineElsewhere
          ? "yes"
          : "no",
    otherSourcing: intake?.otherSourcing ?? "",
  };
}

/**
 * Folds the form's groups into the job's existing intake.
 *
 * A merge, not a replacement: the API stores `intake` wholesale, so sending
 * only what this form collects would delete anything another surface wrote.
 * Returns undefined when the result is empty, so a job that never had an intake
 * does not gain an empty one.
 */
export function toIntakeInput(
  values: FormOwnedIntake,
  existing: JobIntake | null,
): JobIntake | undefined {
  // A local copy: the keys below are re-derived from the form, and the rest of
  // `existing` passes through as-is.
  const merged: JobIntake = { ...(existing ?? {}) };
  for (const key of FORM_OWNED_KEYS) {
    delete merged[key];
  }

  const companyDetails = toCompanyDetailsInput(values.companyDetails);
  if (companyDetails !== undefined) merged.companyDetails = companyDetails;
  merged.workModel = values.workModel;
  // Only a hybrid role has on-site days; an on-site or remote one must not
  // smuggle a stale count back to the API.
  const onsiteDays =
    values.workModel === "hybrid"
      ? inputToNumber(values.onsiteDaysPerWeek)
      : undefined;
  if (onsiteDays !== undefined) merged.onsiteDaysPerWeek = onsiteDays;

  const worksiteAddress = orUndefined(values.worksiteAddress);
  if (worksiteAddress !== undefined) merged.worksiteAddress = worksiteAddress;
  const worksiteZip = orUndefined(values.worksiteZip);
  if (worksiteZip !== undefined) merged.worksiteZip = worksiteZip;
  const benefitsSummary = orUndefined(values.benefitsSummary);
  if (benefitsSummary !== undefined) merged.benefitsSummary = benefitsSummary;

  const selectionKeys = values.selectionKeys.filter(
    (entry) => entry.trim() !== "",
  );
  if (selectionKeys.length > 0) merged.selectionKeys = selectionKeys;

  if (values.positionOpenReason !== "") {
    merged.positionOpenReason = values.positionOpenReason;
    // Only meaningful against a current employee's seat.
    if (values.positionOpenReason === "replacing_current") {
      merged.confidentialSearch = values.confidentialSearch;
    }
  }
  const daysAndHours = orUndefined(values.daysAndHours);
  if (daysAndHours !== undefined) merged.daysAndHours = daysAndHours;
  const reportsTo = orUndefined(values.reportsTo);
  if (reportsTo !== undefined) merged.reportsTo = reportsTo;

  if (hasBenefits(values.benefits)) {
    merged.benefits = toBenefitsInput(values.benefits);
  }
  if (values.timelineToHire !== "") {
    merged.offerTimeline = values.timelineToHire;
  }
  if (values.mustHave.length > 0 || values.niceToHave.length > 0) {
    merged.qualifications = {
      mustHave: values.mustHave,
      niceToHave: values.niceToHave,
    };
  }
  if (values.interviewRounds.length > 0) {
    // `order` is the row position, so removing round 2 renumbers the rest
    // instead of leaving a gap the API would store verbatim.
    merged.interviewProcess = values.interviewRounds.map((round, index) => ({
      order: index + 1,
      type: round.type,
      durationMinutes: Number(round.durationMinutes),
    }));
  }
  if (
    values.interviewingAsap ||
    values.interviewingFrom !== "" ||
    values.interviewingTo !== ""
  ) {
    merged.interviewingAvailability = {
      asap: values.interviewingAsap,
      // ASAP and a date range are alternatives, so the dates go only with the
      // range: an ASAP answer must not smuggle stale dates back to the API.
      from: values.interviewingAsap
        ? undefined
        : orUndefined(values.interviewingFrom),
      to: values.interviewingAsap
        ? undefined
        : orUndefined(values.interviewingTo),
    };
  }
  if (values.postedOnline !== "") {
    merged.postedOnlineElsewhere = values.postedOnline === "yes";
  }
  if (values.otherSourcing !== "") {
    merged.otherSourcing = values.otherSourcing;
  }

  return Object.keys(merged).length === 0 ? undefined : merged;
}
