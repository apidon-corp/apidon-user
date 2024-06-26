import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import Authentication from "./Authentication/Authentication";
import PostCreateButton from "./SearchBar/PostCreateButton";

import NFTButton from "./NFTButton";
import { Notification } from "./Notification/Notification";
import SearchBar from "./SearchBar/SearchBar";

export default function Navbar() {
  const router = useRouter();

  return (
    <>
      <Flex
        id="small-screen-navbar"
        position="sticky"
        top="0"
        left="0"
        right="0"
        width="100%"
        height="50px"
        backdropFilter="auto"
        backdropBlur="10px"
        justify="space-between"
        align="center"
        bg="rgba(0, 0, 0, 0.8)"
        zIndex="banner"
        px={3}
        gap={2}
        display={{
          base: "flex",
          sm: "flex",
          md: "none",
          lg: "none",
        }}
      >
        <Flex
          height="100%"
          align="center"
          justify="center"
          cursor="pointer"
          onClick={() => router.push("/")}
        >
          <Image src="/og.png" height="75%" />
        </Flex>

        <Box flex="1" ml={1}>
          <SearchBar />
        </Box>

        <Box>
          <Flex align="center" gap={2}>
            <Notification />
            <PostCreateButton />
            <Authentication />
          </Flex>
        </Box>
      </Flex>

      <Flex
        id="large-screen-navbar"
        display={{
          base: "none",
          sm: "none",
          md: "flex",
          lg: "flex",
        }}
        position="sticky"
        top="0"
        left="0"
        right="0"
        width="100%"
        height="50px"
        py="2"
        px="7"
        bg="rgba(0, 0, 0, 0.8)"
        backdropFilter="auto"
        backdropBlur="10px"
        zIndex="banner"
      >
        <Flex justify="flex-start" width="100%">
          <Text
            color="white"
            fontSize="20pt"
            fontWeight={700}
            cursor="pointer"
            onClick={() => router.push("/")}
          >
            apidon
          </Text>
        </Flex>
        <Flex justify="center" width="100%">
          <SearchBar />
        </Flex>
        <Flex justify="flex-end" width="100%" align="center" gap={3}>
          <NFTButton />
          <Notification />
          <PostCreateButton />
          <Authentication />
        </Flex>
      </Flex>
    </>
  );
}
