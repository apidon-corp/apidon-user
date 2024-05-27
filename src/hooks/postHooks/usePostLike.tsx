import { PostLikeAPIBody } from "@/components/types/API";
import { auth } from "@/firebase/clientApp";

const usePostLike = () => {
  /**
   * @param postDocPath
   * @param opCode "1" for like "-1" for like-remove
   * @returns true if operation is successfull, otherwise false.
   */
  const like = async (postDocPath: string, opCode: -1 | 1) => {
    let idToken = "";
    try {
      idToken = (await auth.currentUser?.getIdToken()) as string;
    } catch (error) {
      console.error("Error while liking. Couln't be got idToken", error);
      return false;
    }

    let response;
    const postLikeAPIBody: PostLikeAPIBody = {
      action: opCode === 1 ? "like" : "delike",
      postDocPath: postDocPath,
    };
    try {
      response = await fetch("/api/postv2/postLike", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ ...postLikeAPIBody }),
      });
    } catch (error) {
      console.error("Error while fetching to 'postLike' API", error);
      return false;
    }

    if (!response.ok) {
      console.error(
        "Error while liking from 'likePost' API",
        await response.text()
      );
      return false;
    }

    return true;
  };
  return {
    like,
  };
};
export default usePostLike;
