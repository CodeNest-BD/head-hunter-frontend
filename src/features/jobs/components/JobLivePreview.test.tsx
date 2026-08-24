import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { JobFormValues } from "../schemas";
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
  recruiterFee: "12000",
};

const noop = () => {};

describe("JobLivePreview", () => {
  it("reflects the typed title, fee, and description as recruiters would see them", () => {
    render(<JobLivePreview values={values} onCollapse={noop} />);

    expect(
      screen.getByRole("heading", { name: "Staff Platform Engineer" }),
    ).toBeInTheDocument();
    expect(screen.getByText("$12,000")).toBeInTheDocument();
    expect(
      screen.getByText("Own the deployment pipeline."),
    ).toBeInTheDocument();
  });

  it("shows a placeholder heading before a title is entered", () => {
    render(
      <JobLivePreview values={{ ...values, title: "" }} onCollapse={noop} />,
    );

    expect(
      screen.getByRole("heading", { name: "Untitled role" }),
    ).toBeInTheDocument();
  });

  it("shows the empty-description state when nothing is written yet", () => {
    render(
      <JobLivePreview
        values={{ ...values, description: "" }}
        onCollapse={noop}
      />,
    );

    expect(
      screen.getByText("No description provided for this role."),
    ).toBeInTheDocument();
  });

  it("collapses when the header control is clicked", () => {
    const onCollapse = vi.fn();
    render(<JobLivePreview values={values} onCollapse={onCollapse} />);

    fireEvent.click(screen.getByLabelText("Collapse preview"));
    expect(onCollapse).toHaveBeenCalledOnce();
  });
});
