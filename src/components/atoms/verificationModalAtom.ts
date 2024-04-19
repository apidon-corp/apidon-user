import { atom } from "recoil";

export const verificationModalAtom = atom<{ isOpen: boolean }>({
  key: "verificationModalAtomKey",
  default: {
    isOpen: false,
  },
});
