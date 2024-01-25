import { auth } from "@/firebase/clientApp";
import { useState } from "react";

export default function useCommentDelete() {
  const [commentDeletionLoading, setCommentDeletionLoading] = useState(false);

  /**
   * 
   * @param commentDocPathOnPost 
   * @returns 
   */
  const commentDelete = async (commentDocPathOnPost: string) => {
    if (!commentDocPathOnPost) {
      return false;
    }
    setCommentDeletionLoading(true);

    const fullPath = commentDocPathOnPost;
    const subStringtoDeleteIndex = fullPath.indexOf("comments");
    const postDocPath = fullPath.substring(0, subStringtoDeleteIndex);

    let idToken = "";
    try {
      idToken = (await auth.currentUser?.getIdToken()) as string;
    } catch (error) {
      console.error(
        "Error while comment deleting. Couln't be got idToken",
        error
      );
      return false;
    }

    let response: Response;

    try {
      response = await fetch("/api/post/comment/postCommentDelete", {
        method: "POST",
        headers: {
          authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commentDocPathOnPost: commentDocPathOnPost,
          postDocPath: postDocPath,
        }),
      });
    } catch (error) {
      console.error("Error while fetching 'postCommentDelete' API", error);
      return false;
    }

    if (!response.ok) {
      console.error(
        "Error while deleting comment from postCommentDelete API",
        await response.json()
      );
      return false;
    }
    setCommentDeletionLoading(false);
    return true;
  };
  return {
    commentDelete,
    commentDeletionLoading,
  };
}
