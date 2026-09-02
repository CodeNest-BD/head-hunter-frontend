import { describe, expect, it } from "vitest";

import type { JobIntake } from "../schemas";
import { intakeToFormValues, toIntakeInput } from "./jobIntake";

/** "Nothing answered", straight from the reader — so this fixture cannot drift
 * away from what the form actually starts with. */
const emptyForm = intakeToFormValues(null);

describe("toIntakeInput", () => {
  it("writes the three groups the form owns", () => {
    const intake = toIntakeInput(
      {
        ...emptyForm,
        timelineToHire: "within_2_weeks",
        mustHave: ["5+ years Python"],
        niceToHave: ["AWS"],
        interviewRounds: [
          { type: "phone", durationMinutes: "30" },
          { type: "video_panel", durationMinutes: "120" },
        ],
      },
      null,
    );

    expect(intake).toEqual({
      // Always present: the work model is a required field with a default, so
      // it is answered even when the company skipped everything else.
      workModel: "on_site",
      offerTimeline: "within_2_weeks",
      qualifications: { mustHave: ["5+ years Python"], niceToHave: ["AWS"] },
      interviewProcess: [
        { order: 1, type: "phone", durationMinutes: 30 },
        { order: 2, type: "video_panel", durationMinutes: 120 },
      ],
    });
  });

  // The blob also carries the worksite address, benefits and company details,
  // which this form never renders. Replacing it wholesale would delete them.
  it("preserves intake keys the form does not collect", () => {
    const existing: JobIntake = {
      positionDuties: "Own the billing subsystem",
      postedOnlineElsewhere: true,
      otherSourcing: "none",
      offerTimeline: "asap",
    };

    const intake = toIntakeInput(
      { ...emptyForm, mustHave: ["Python"] },
      existing,
    );

    // `positionDuties` is written by no surface this app renders, so it must
    // ride through an edit untouched.
    expect(intake).toMatchObject({
      positionDuties: "Own the billing subsystem",
    });
  });

  it("drops a group the company cleared, without touching the rest", () => {
    const existing: JobIntake = {
      positionDuties: "Own the billing subsystem",
      worksiteAddress: "123 Market St",
      offerTimeline: "asap",
      qualifications: { mustHave: ["Python"], niceToHave: [] },
      interviewProcess: [{ order: 1, type: "phone", durationMinutes: 30 }],
    };

    const intake = toIntakeInput(emptyForm, existing);

    // The worksite address goes too: it is a field this form owns, so an empty
    // box means the company cleared it.
    expect(intake).toEqual({
      positionDuties: "Own the billing subsystem",
      workModel: "on_site",
    });
  });

  it("writes the benefits block only when something was ticked", () => {
    expect(toIntakeInput(emptyForm, null)?.benefits).toBeUndefined();

    const intake = toIntakeInput(
      {
        ...emptyForm,
        benefits: {
          ...emptyForm.benefits,
          medical: true,
          retirement401k: true,
          retirement401kMatch: "4",
          ancillary: true,
          ancillaryDetails: "Commuter benefit",
        },
      },
      null,
    );

    expect(intake?.benefits).toEqual({
      medical: true,
      dental: false,
      vision: false,
      sickTime: false,
      vacation: false,
      ancillary: true,
      ancillaryDetails: "Commuter benefit",
      retirement401k: { offered: true, matchPercent: 4 },
      educationReimbursement: false,
      vacationDays: undefined,
      sickDays: undefined,
    });
  });

  // ASAP and a date range are alternatives; an ASAP answer must not smuggle a
  // stale range back to the API.
  it("sends no dates alongside an ASAP availability", () => {
    const intake = toIntakeInput(
      {
        ...emptyForm,
        interviewingAsap: true,
        interviewingFrom: "2026-09-01",
        interviewingTo: "2026-09-30",
      },
      null,
    );

    expect(intake?.interviewingAvailability).toEqual({
      asap: true,
      from: undefined,
      to: undefined,
    });
  });

  it("maps the yes/no answers to booleans and the sourcing enum through", () => {
    const intake = toIntakeInput(
      { ...emptyForm, postedOnline: "no", otherSourcing: "other_agencies" },
      null,
    );

    expect(intake).toMatchObject({
      postedOnlineElsewhere: false,
      otherSourcing: "other_agencies",
    });
  });

  // Prefilled from the company profile and editable per job, so a company that
  // has answered only part of its profile still gets those answers onto the
  // job. Only a wholly empty block is withheld.
  it("writes whichever company details are filled", () => {
    const partial = toIntakeInput(
      {
        ...emptyForm,
        companyDetails: {
          industry: "SaaS",
          employeeSize: "51-200",
          revenue: "",
          yearsInBusiness: "12",
          whatTheyDo: "",
        },
      },
      null,
    );
    expect(partial?.companyDetails).toEqual({
      industry: "SaaS",
      employeeSize: "51-200",
      // A number for the API, though the input produces a string.
      yearsInBusiness: 12,
    });

    const complete = toIntakeInput(
      {
        ...emptyForm,
        companyDetails: {
          industry: "SaaS",
          employeeSize: "51-200",
          revenue: "$50M",
          yearsInBusiness: "12",
          whatTheyDo: "We fit out small showrooms.",
        },
      },
      null,
    );
    expect(complete?.companyDetails).toEqual({
      industry: "SaaS",
      employeeSize: "51-200",
      revenue: "$50M",
      yearsInBusiness: 12,
      whatTheyDo: "We fit out small showrooms.",
    });
  });

  // An empty object would replace a stored snapshot with nothing.
  it("withholds the company block when nothing in it is filled", () => {
    expect(toIntakeInput(emptyForm, null)?.companyDetails).toBeUndefined();
  });

  it("writes only the work model for a job whose questionnaire is untouched", () => {
    expect(toIntakeInput(emptyForm, null)).toEqual({ workModel: "on_site" });
  });

  it("renumbers rounds by position, so removing one leaves no gap", () => {
    const intake = toIntakeInput(
      {
        ...emptyForm,
        interviewRounds: [
          { type: "video", durationMinutes: "60" },
          { type: "in_person", durationMinutes: "480" },
        ],
      },
      { interviewProcess: [{ order: 7, type: "phone", durationMinutes: 30 }] },
    );

    expect(intake?.interviewProcess?.map((stage) => stage.order)).toEqual([
      1, 2,
    ]);
  });
});

describe("intakeToFormValues", () => {
  it("reads an intake back into form values, rounds in order", () => {
    expect(
      intakeToFormValues({
        offerTimeline: "flexible",
        qualifications: { mustHave: ["Go"], niceToHave: ["K8s"] },
        interviewProcess: [
          { order: 2, type: "video", durationMinutes: 60 },
          { order: 1, type: "phone", durationMinutes: 30 },
        ],
      }),
    ).toMatchObject({
      timelineToHire: "flexible",
      mustHave: ["Go"],
      niceToHave: ["K8s"],
      interviewRounds: [
        { type: "phone", durationMinutes: "30" },
        { type: "video", durationMinutes: "60" },
      ],
    });
  });

  it("reads the benefits block back into checkbox and match values", () => {
    const values = intakeToFormValues({
      benefits: {
        medical: true,
        dental: false,
        vision: true,
        sickTime: false,
        vacation: true,
        ancillary: true,
        ancillaryDetails: "Commuter benefit",
        retirement401k: { offered: true, matchPercent: 4 },
      },
      interviewingAvailability: {
        asap: false,
        from: "2026-09-01",
        to: "2026-09-30",
      },
      postedOnlineElsewhere: true,
    });

    expect(values.benefits).toEqual({
      medical: true,
      dental: false,
      vision: true,
      sickTime: false,
      vacation: true,
      retirement401k: true,
      retirement401kMatch: "4",
      ancillary: true,
      ancillaryDetails: "Commuter benefit",
      educationReimbursement: false,
      vacationDays: "",
      sickDays: "",
    });
    expect(values).toMatchObject({
      interviewingAsap: false,
      interviewingFrom: "2026-09-01",
      interviewingTo: "2026-09-30",
      postedOnline: "yes",
    });
  });

  it("gives a job with no intake a blank, unticked form", () => {
    expect(intakeToFormValues(null)).toEqual({
      companyDetails: {
        industry: "",
        employeeSize: "",
        revenue: "",
        yearsInBusiness: "",
        whatTheyDo: "",
      },
      workModel: "on_site",
      onsiteDaysPerWeek: "",
      worksiteZip: "",
      benefitsSummary: "",
      selectionKeys: [],
      positionOpenReason: "",
      confidentialSearch: false,
      worksiteAddress: "",
      daysAndHours: "",
      reportsTo: "",
      benefits: {
        medical: false,
        dental: false,
        vision: false,
        sickTime: false,
        vacation: false,
        retirement401k: false,
        retirement401kMatch: "",
        ancillary: false,
        ancillaryDetails: "",
        educationReimbursement: false,
        vacationDays: "",
        sickDays: "",
      },
      timelineToHire: "",
      mustHave: [],
      niceToHave: [],
      interviewRounds: [],
      interviewingAsap: false,
      interviewingFrom: "",
      interviewingTo: "",
      postedOnline: "",
      otherSourcing: "",
    });
  });
});
