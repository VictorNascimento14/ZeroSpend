import { describe, expect, it } from "vitest";
import { addDays, addMonths, daysBetween, isIsoDate, toIsoDate } from "./dates";

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

describe("addMonths", () => {
  it("soma meses e vira o ano", () => {
    expect(addMonths("2026-10-05", 1)).toBe("2026-11-05");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
    expect(addMonths("2026-10-05", 12)).toBe("2027-10-05");
  });

  it("encosta no último dia quando o dia não existe no mês de destino", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonths("2026-03-31", 1)).toBe("2026-04-30");
    expect(addMonths("2028-02-29", 12)).toBe("2029-02-28");
  });

  it("aceita meses negativos", () => {
    expect(addMonths("2026-01-15", -1)).toBe("2025-12-15");
  });
});

describe("addDays", () => {
  it("soma e subtrai dias, virando mês e ano", () => {
    expect(addDays("2026-09-29", 5)).toBe("2026-10-04");
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("daysBetween", () => {
  it("conta dias corridos entre duas datas sem hora", () => {
    expect(daysBetween("2026-09-29", "2026-09-29")).toBe(0);
    expect(daysBetween("2026-09-29", "2026-10-04")).toBe(5);
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
    expect(daysBetween("2026-10-04", "2026-09-29")).toBe(-5);
  });
});
