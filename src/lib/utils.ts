import { createCn } from "cn/config";

// `text-h1`…`text-h4` são os títulos do kit (tamanho, peso e tracking), não cores. Sem declará-los,
// `cn("text-h3", "text-foreground")` trata os dois como cor e descarta o título.
export const cn = createCn({
  extend: { classGroups: { "font-size": [{ text: ["h1", "h2", "h3", "h4"] }] } },
});
