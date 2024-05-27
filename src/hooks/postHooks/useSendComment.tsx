import { CommentDataV2 } from "@/components/types/Post";
import { auth } from "@/firebase/clientApp";

export default function useSendComment() {
  /**
   * No need to pass sender, it is currentUser.
   * @param postDocPath
   * @param comment
   * @returns comment doc-id of newly created comment if there is a success, otherwise an empty string
   */
  const sendComment = async (postDocPath: string, comment: string) => {
    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) return false;

    try {
      const idToken = await currentUserAuthObject.getIdToken();

      const response = await fetch("/api/postv2/postComment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          message: comment,
          postDocPath: postDocPath,
        }),
      });

      if (!response.ok) {
        console.error("Error from 'postComments' API:", await response.text());
        return false;
      }

      const result = await response.json();

      const createdCommentObject = result.commentData as CommentDataV2;
      return createdCommentObject;
    } catch (error) {
      console.error("Error while 'fetching' to 'postComment' API", error);
      return false;
    }
  };
  return {
    sendComment,
  };
}
