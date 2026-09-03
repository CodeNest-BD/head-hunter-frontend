import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { JobFormValues } from "../schemas";
import { intakeToFormValues } from "../utils/jobIntake";
import { JobLivePreview } from "./JobLivePreview";

const values: JobFormValues = {
  title: "Staff Platform Engineer",
  description: "<p>Own the deployment pipeline.</p>",
  roleCategory: "engineering",
  employmentType: "full_time",
  locationState: "NY",
  locationCity: "New York",
  salaryMin: "150000",
  salaryMax: "200000",
  salaryRatePeriod: "per_year",
  recruiterFee: "12000",
  companyName: "Northwind Robotics",
  // The intake half of the form, unanswered.
  ...intakeToFormValues(null),
};

const noop = () => {};

describe("JobLivePreview", () => {
  it("reflects the typed title and fee as recruiters would see them", () => {
    render(<JobLivePreview values={values} onCollapse={noop} />);

    expect(
      screen.getByRole("heading", { name: "Staff Platform Engineer" }),
    ).toBeInTheDocument();
    expect(screen.getByText("$12,000")).toBeInTheDocument();
  });

  it("shows a placeholder heading before a title is entered", () => {
    render(
      <JobLivePreview values={{ ...values, title: "" }} onCollapse={noop} />,
    );

    expect(
      screen.getByRole("heading", { name: "Untitled role" }),
    ).toBeInTheDocument();
  });

  it("omits the position details / description block from the preview", () => {
    render(<JobLivePreview values={values} onCollapse={noop} />);

    // The preview deliberately excludes Position Details (the description); it
    // lives on the posted job, not this at-a-glance preview.
    expect(
      screen.queryByText("Own the deployment pipeline."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Position Details")).not.toBeInTheDocument();
  });

  // Blank money must not preview as NaN or $0 noise — the old form->view
  // adapter guarded this, and the panel now owns it.
  it("previews an unentered fee as $0 and an unset pay range as a dash", () => {
    render(
      <JobLivePreview
        values={{ ...values, recruiterFee: "", salaryMin: "", salaryMax: "" }}
        onCollapse={noop}
      />,
    );

    expect(screen.getByText("$0")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("names the full state and the work model in the location line", () => {
    render(
      <JobLivePreview
        values={{ ...values, workModel: "hybrid", onsiteDaysPerWeek: "3" }}
        onCollapse={noop}
      />,
    );

    expect(
      screen.getByText("New York, New York (Hybrid, 3 days on site)"),
    ).toBeInTheDocument();
  });

  it("shows the hiring decision keys the company entered", () => {
    render(
      <JobLivePreview
        values={{ ...values, selectionKeys: ["Ships code", "Mentors"] }}
        onCollapse={noop}
      />,
    );

    expect(screen.getByText("Ships code")).toBeInTheDocument();
    expect(screen.getByText("Mentors")).toBeInTheDocument();
  });

  it("flags a confidential replacement search", () => {
    render(
      <JobLivePreview
        values={{
          ...values,
          positionOpenReason: "replacing_current",
          confidentialSearch: true,
        }}
        onCollapse={noop}
      />,
    );

    expect(
      screen.getByText("Replacing Current Employee (confidential)"),
    ).toBeInTheDocument();
  });

  it("collapses when the header control is clicked", () => {
    const onCollapse = vi.fn();
    render(<JobLivePreview values={values} onCollapse={onCollapse} />);

    fireEvent.click(screen.getByLabelText("Collapse preview"));
    expect(onCollapse).toHaveBeenCalledOnce();
  });
});
