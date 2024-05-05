import { Flex, Image, Skeleton } from "@chakra-ui/react";

export default function PostPreviewItem() {
  return (
    <Flex direction="column">
      <Image
        alt=""
        src={""}
        width="50px"
        height="50px"
        fallback={
          <Skeleton
            width="50px"
            height="50px"
            startColor="gray.100"
            endColor="gray.800"
          />
        }
      />
    </Flex>
  );
}
