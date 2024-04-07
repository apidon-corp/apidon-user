import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
      <script async src={process.env.NEXT_PUBLIC_STATUS_PAGE_CODE} />;
    </Html>
  );
}
