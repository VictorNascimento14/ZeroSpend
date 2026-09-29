import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Quando detecta um agente de código, o `next dev` anexa um bloco gerado ao CLAUDE.md. As regras
  // deste repositório são escritas à mão e ficam lá — o dev não reescreve o arquivo.
  agentRules: false,
};

export default nextConfig;
