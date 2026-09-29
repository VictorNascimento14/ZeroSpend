import { ImageResponse } from "next/og";

// O ícone da tela inicial do iPhone: o mesmo "Z" do icon.svg, sem cantos (o sistema arredonda).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <svg width="180" height="180" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        {/* cerulean, a cor primária do kit (ver globals.css) */}
        <rect width="32" height="32" fill="#0068e9" />
        <path d="M9 9h14v3.2l-9.4 7.6H23V23H9v-3.2l9.4-7.6H9z" fill="#fff" />
      </svg>
    ),
    size,
  );
}
