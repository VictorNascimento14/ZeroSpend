import { describe, expect, it } from "vitest";
import { isIsoDate, toIsoDate } from "./dates";

describe("fuso dos testes", () => {
  it("roda em São Paulo (UTC−3), onde o bug de data aparece", () => {
    expect(new Date(2026, 9, 5).getTimezoneOffset()).toBe(180);
  });

  it("mostra a armadilha que os helpers evitam: new Date('YYYY-MM-DD') volta um dia", () => {
    expect(new Date("2026-10-05").getDate()).toBe(4);
  });
});

describe("isIsoDate", () => {
  it.each(["2026-10-05", "2028-02-29", "2026-12-31"])("aceita %s", (value) => {
    expect(isIsoDate(value)).toBe(true);
  });

  it.each(["2026-02-29", "2026-02-30", "2026-13-01", "2026-10-5", "05/10/2026", "", "2026-10-05T00:00"])(
    "recusa %j",
    (value) => {
      expect(isIsoDate(value)).toBe(false);
    },
  );
});

describe("toIsoDate", () => {
  it("usa o dia local, mesmo perto da meia-noite", () => {
    expect(toIsoDate(new Date(2026, 9, 5, 0, 1))).toBe("2026-10-05");
    expect(toIsoDate(new Date(2026, 9, 5, 23, 59))).toBe("2026-10-05");
  });

  it("completa mês e dia com zero", () => {
    expect(toIsoDate(new Date(2026, 0, 9))).toBe("2026-01-09");
  });
});
