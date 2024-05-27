import { atom } from "recoil";
import { PostItemDataV2 } from "../types/Post";

export const postsAtViewAtom = atom<PostItemDataV2[]>({
  key: "postsAtViewAtom",
  default: [],
});
