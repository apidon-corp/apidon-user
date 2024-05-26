import { CommendDataV2 } from "@/components/types/Post";
import { auth } from "@/firebase/clientApp";
import { useState } from "react";

export default function useCommentDelete() {
  const [commentDeletionLoading, setCommentDeletionLoading] = useState(false);

  /**
   *
   * @param commentDocPathOnPost
   * @returns
   */
  const commentDelete = async (
    postDocPath: string,
    commentObject: CommendDataV2
  ) => {
    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) return false;

    setCommentDeletionLoading(true);

    try {
      const idToken = await currentUserAuthObject.getIdToken(true);

      const response = await fetch("/api/postv2/postCommentDelete", {
        method: "POST",
        headers: {
          authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commentObject: commentObject,
          postDocPath: postDocPath,
        }),
      });

      if (!response.ok) {
        console.error(
          "Response from postCommentDelete is not okay: \n",
          await response.text()
        );
        setCommentDeletionLoading(false);
        return false;
      }

      setCommentDeletionLoading(false);
      return true;
    } catch (error) {
      console.error("Error on fetching to postCommentDelete API: \n", error);
      setCommentDeletionLoading(false);
      return false;
    }
  };
  return {
    commentDelete,
    commentDeletionLoading,
  };
}
