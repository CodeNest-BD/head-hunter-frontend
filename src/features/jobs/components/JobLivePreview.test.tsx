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
  isRemote: false,
  salaryMin: "150000",
  salaryMax: "200000",
  salaryRatePeriod: "per_year",
  recruiterFee: "12000",
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

  it("omits the description entirely — the preview is facts only", () => {
    render(<JobLivePreview values={values} onCollapse={noop} />);

    expect(
      screen.queryByText("Own the deployment pipeline."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("No description provided for this role."),
    ).not.toBeInTheDocument();
  });

  it("collapses when the header control is clicked", () => {
    const onCollapse = vi.fn();
    render(<JobLivePreview values={values} onCollapse={onCollapse} />);

    fireEvent.click(screen.getByLabelText("Collapse preview"));
    expect(onCollapse).toHaveBeenCalledOnce();
  });
});
