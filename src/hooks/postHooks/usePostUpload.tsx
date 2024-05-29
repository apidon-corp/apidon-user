import { currentUserStateAtom } from "@/components/atoms/currentUserAtom";
import { PostCreateForm, PostServerDataV2 } from "@/components/types/Post";
import { auth } from "@/firebase/clientApp";
import { useRouter } from "next/router";
import { useState } from "react";
import { useRecoilValue } from "recoil";

const usePostCreate = () => {
  const [willBeCroppedPostPhoto, setWillBeCroppedPostPhoto] = useState("");
  const [postUploadLoading, setPostUploadUpdating] = useState(false);
  const currentUserstate = useRecoilValue(currentUserStateAtom);

  const router = useRouter();

  const onSelectWillBeCroppedPhoto = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files) {
      return console.error("No Files provided to onSelectWillBeCroppedPhoto");
    }

    const file = event.target.files[0];

    if (!file.type.startsWith("image/")) {
      return console.log("Only Images");
    }

    // 50mb
    if (file.size > 50 * 10 ** 6) {
      return console.error("This image is too high quality");
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (readerEvent) => {
      setWillBeCroppedPostPhoto(readerEvent.target?.result as string);
    };
  };

  /**
   * @param postCreateForm
   * @returns true if operation is successfull, otherwise false.
   */
  const sendPost = async (postCreateForm: PostCreateForm) => {
    // This is my third control but, I don't trust states really :/
    if (!postCreateForm.description && !postCreateForm.image) {
      console.log("You Can not create empty post, aborting");
      return false;
    }
    setPostUploadUpdating(true);

    let idToken = "";
    try {
      idToken = (await auth.currentUser?.getIdToken()) as string;
    } catch (error) {
      console.error("Error while post deleting. Couln't be got idToken", error);
      setPostUploadUpdating(false);
      return false;
    }

    const description = postCreateForm.description;
    const image = postCreateForm.image;

    let response: Response;
    try {
      response = await fetch("/api/postv2/postUpload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ description, image }),
      });
    } catch (error) {
      console.error("Error while fetching to 'postUpload' API", error);
      setPostUploadUpdating(false);
      return false;
    }

    if (!response.ok) {
      console.error(
        "Error while postUpload from 'postUpload' API",
        await response.text()
      );
      setPostUploadUpdating(false);
      return false;
    }

    const result = await response.json();
    
    const newPostServerData: PostServerDataV2 = result.newPostData;
    const newPostDocId: string = result.newPostDocId;

    // if (router.asPath === `/${currentUserstate.username}`) {
    //   const newPostData: PostItemDataV2 = {
    //     ...newPostServerData,
    //     currentUserLikedThisPost: false,
    //     id: newPostDocId,
    //     currentUserFollowThisSender: false,
    //   };
    //   setPostsAtView((prev) => [newPostData, ...prev]);
    // } else if (router.asPath === "/") {
    //   const newPostData: PostItemDataV2 = {
    //     ...newPostServerData,
    //     currentUserLikedThisPost: false,
    //     id: newPostDocId,
    //     currentUserFollowThisSender: false,
    //   };
    //   setPostsAtView((prev) => [newPostData, ...prev]);
    // }
    setPostUploadUpdating(false);
    return true;
  };

  return {
    willBeCroppedPostPhoto,
    setWillBeCroppedPostPhoto,
    onSelectWillBeCroppedPhoto,
    sendPost,
    postUploadLoading,
  };
};

export default usePostCreate;
