import { atom } from "recoil";

export const createFrenletModalAtom = atom<{
  isOpen: boolean;
}>({
  key: "frenletCreateModalAtom",
  default: {
    isOpen: false,
  },
});
