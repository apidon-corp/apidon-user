import { createFrenletModalAtom } from "@/components/atoms/createFrenletModalAtom";
import { currentUserStateAtom } from "@/components/atoms/currentUserAtom";
import { Flex, Icon } from "@chakra-ui/react";
import { AiOutlinePlus } from "react-icons/ai";
import { useRecoilValue, useSetRecoilState } from "recoil";

export default function FrenletCreateButton() {
  const setCreateFrenletModalState = useSetRecoilState(createFrenletModalAtom);
  const currentUserState = useRecoilValue(currentUserStateAtom);
  return (
    <Flex id="button">
      {currentUserState.isThereCurrentUser && (
        <Icon
          as={AiOutlinePlus}
          color="pink.500"
          fontSize="2xl"
          cursor="pointer"
          onClick={() => {
            setCreateFrenletModalState({ isOpen: true });
          }}
        />
      )}
    </Flex>
  );
}
