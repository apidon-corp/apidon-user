import { Flex, Text } from "@chakra-ui/react";

export default function Footer() {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      border="1px solid red"
      my={5}
    >
      <Text as="b" textColor="gray.300" fontSize="15pt">
        apidon
      </Text>
      <Text as="b" textColor="gray.300" fontSize="9pt">
        Made with ❤️ in Istanbul
      </Text>
      <Text as="b" textColor="gray.300" fontSize="9pt">
        Version:{" "}
        {process.env.NEXT_PUBLIC_VERSION_IDENTIFIER
          ? process.env.NEXT_PUBLIC_VERSION_IDENTIFIER
          : "53"}
      </Text>
      <Flex
        align="center"
        gap={1}
        cursor="pointer"
        onClick={() => {
          window.open("https://github.com/aboveStars/apidon-user", "blank");
        }}
      >
        <Text as="b" textColor="gray.300" fontSize="8pt">
          Give ⭐️ on GitHub
        </Text>
      </Flex>
    </Flex>
  );
}
