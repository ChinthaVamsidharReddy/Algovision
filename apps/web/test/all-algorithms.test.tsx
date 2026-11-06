import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listAlgorithms } from "@algovision/algorithms";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => "/algorithms/x",
}));

import { Workspace } from "../src/components/workspace/workspace";

beforeEach(() => window.history.replaceState(null, "", "/"));

/** Every registered algorithm must work end to end in the shared workspace, whatever its structure. */
describe("every registered algorithm renders and plays in the workspace", () => {
  for (const { id, content } of listAlgorithms()) {
    it(`${id} (wave ${content.meta.wave}, ${content.meta.stateKind})`, async () => {
      const user = userEvent.setup();
      const { container } = render(<Workspace algorithmId={id} />);
      expect(screen.getByRole("heading", { level: 1, name: content.meta.title })).toBeInTheDocument();
      expect(screen.getByRole("img")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /^Step 1 of \d+$/ })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /Next/ }));
      expect(screen.getByTestId("explanation").textContent!.length).toBeGreaterThan(10);

      fireEvent.keyDown(document.body, { key: "End" });
      expect(screen.getByRole("button", { name: /Next/ })).toBeDisabled();
      expect(screen.getByTestId("state-text").textContent!.length).toBeGreaterThan(0);

      for (const lang of ["Java", "Python", "C++", "C"]) {
        await user.click(screen.getByRole("tab", { name: lang }));
        expect(container.querySelectorAll('[data-active="true"]').length).toBeGreaterThan(0);
      }
      const r = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
      expect(r.violations.map((v) => v.id)).toEqual([]);
    });
  }
});
