import Posts from "@/components/Post/Posts";
import { Flex } from "@chakra-ui/react";

type Props = {
  postDocPaths: string[];
};

export default function UserContent({ postDocPaths }: Props) {
  return (
    <Flex justify="center" width="100%">
      <Posts postDocPathArray={postDocPaths} />
    </Flex>
  );
}
