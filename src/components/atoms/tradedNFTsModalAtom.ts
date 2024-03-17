import { atom } from "recoil";

export const tradedNFTsModalAtom = atom<{ isOpen: boolean }>({
  key: "tradedNFTsModalAtom",
  default: {
    isOpen: false,
  },
});
