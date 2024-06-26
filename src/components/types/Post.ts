export type PostCreateForm = {
  description: string;
  tempImageLocation: string;
};

// /**
//  * This Type are used at Firebase, mostly.
//  */
// export type PostServerData = {
//   senderUsername: string;

//   description: string;
//   image: string;

//   likeCount: number;
//   commentCount: number;

//   nftStatus: {
//     convertedToNft: boolean;
//     nftDocPath?: string;
//   };

//   creationTime: number;
// };

export type PostServerDataV2 = {
  senderUsername: string;

  description: string;
  image: string;

  likeCount: number;
  likes: LikeDataV2[];

  commentCount: number;
  comments: CommentDataV2[];

  nftStatus: {
    convertedToNft: boolean;
    nftDocPath?: string;
  };

  creationTime: number;
  id: string;
};

/**
 * This type are used mostly for state management, frontend.
 */
// export type PostItemData = {
//   senderUsername: string;

//   description: string;
//   image: string;

//   likeCount: number;
//   currentUserLikedThisPost: boolean;

//   commentCount: number;

//   postDocId: string;

//   nftStatus: {
//     convertedToNft: boolean;
//     nftDocPath?: string;
//   };

//   currentUserFollowThisSender: boolean;

//   creationTime: number;
// };

// export type PostItemDataV2 = {
//   senderUsername: string;

//   description: string;
//   image: string;

//   likeCount: number;
//   likes: LikeDataV2[];

//   commentCount: number;
//   comments: CommentDataV2[];

//   id: string;

//   nftStatus: {
//     convertedToNft: boolean;
//     nftDocPath?: string;
//   };

//   creationTime: number;
// };

/**
 * This type are used mostly for state management, frontend.
 */
export type PostFrontData = {
  senderUsername: string;

  description: string;
  image: string;

  likeCount: number;
  likers: string[];
  commentCount: number;

  id: string;

  nftStatus: {
    convertedToNft: boolean;
    nftDocPath?: string;
  };

  creationTime: number;
};

export type LikeDatasArrayType = {
  likeTime: number;
  likedPostDocPath: string;
}[];

/**
 * Comment Data in Firebase on Post.
 */
export type CommentData = {
  commentSenderUsername: string;
  comment: string;
  creationTime: number;
};

export type CommentDataV2 = {
  sender: string;
  message: string;
  ts: number;
};

export type LikeDataV2 = {
  sender: string;
  ts: number;
};

export type CommentInteractionData = {
  postDocPath: string;
  creationTime: number;
};

export type OpenPanelName = "main" | "comments" | "likes" | "nft";

export type LikeData = {
  likeCount: number;
  likeColPath: string;
};

export type SendNftStatus =
  | "initial"
  | "uploadingMetadata"
  | "sendingRequest"
  | "waitingForConfirmation"
  | "updatingPost"
  | "final";

export type PostStatus = {
  loading: boolean;
};
