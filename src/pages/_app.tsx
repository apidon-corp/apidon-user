import { theme } from "@/components/chakra/theme";
import Layout from "@/components/Layout/Layout";
import { IPagePreviewData } from "@/components/types/User";
import { ChakraProvider } from "@chakra-ui/react";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import NextNProgress from "nextjs-progressbar";
import { RecoilRoot } from "recoil";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Last settings for links preview...
  // "undefined" for error pages (400 and 500). They don't have any metatags. (At least I don't set meta-tags for them)

  const fetchedPagePreviewData: IPagePreviewData | undefined =
    pageProps.pagePreviewData;
  console.log(fetchedPagePreviewData);
  const title: string = fetchedPagePreviewData?.title
    ? fetchedPagePreviewData.title
    : "Apdion";
  const description: string = fetchedPagePreviewData?.description
    ? fetchedPagePreviewData.description
    : "Socialize, choose your algorithm, earn rewards and create NFTs!";
  const type: string = fetchedPagePreviewData?.type
    ? fetchedPagePreviewData.type
    : "website";
  const url: string = fetchedPagePreviewData?.url
    ? fetchedPagePreviewData.url
    : "https://app.apidon.com";
  const image: string = fetchedPagePreviewData?.image
    ? fetchedPagePreviewData.image
    : "https://app.apidon.com/og.png";

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />

        <meta property="description" content={description} />
        <meta property="og:title" content={title} key="title" />
        <meta property="og:description" content={description} key="desc" />
        <meta property="og:type" content={type} key="type" />
        <meta property="og:url" content={url} key="url" />
        <meta property="og:image" content={image} key="image" />

        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
      </Head>
      <RecoilRoot>
        <ChakraProvider theme={theme}>
          <Layout>
            <NextNProgress color="#1479EA" height={4} />
            <Component {...pageProps} />
          </Layout>
        </ChakraProvider>
      </RecoilRoot>
    </>
  );
}
