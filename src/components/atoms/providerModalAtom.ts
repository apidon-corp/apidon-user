import { atom } from "recoil";

type IProviderModalState = {
  isOpen: boolean;
};

export const providerModalStateAtom = atom<IProviderModalState>({
  key: "providerModalAtom",
  default: {
    isOpen: false,
  },
});
