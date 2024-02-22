/**
 * Use when requesting /classification/likeAction API which is in Proivder side.
 */
export type PostLikeActionAPIBody = {
  username: string;
  providerId: string;
  startTime: number;
  postDocPath: string;
};

export type PostLikeAPIBody = {
  opCode: -1 | 1;
  postDocPath: string;
};

/**
 * Use when requesting /classification/commentAction API which is in Proivder side.
 */
export type CommentActionAPIBody = {
  username: string;
  providerId: string;
  startTime: number;
  postDocPath: string;
};

export type InteractedPostObject = {
  timestamp: number;
  postDocPath: string;
};

export type DealAPIBody = {
  username: string;
  provider: string;
  interactedPostsObjectsArray: InteractedPostObject[];
};

// Read APIs Part

interface JSONData {
  [key: string]: JSONData | string | number | boolean | null;
}

export type GetDocBody = {
  docPath: string;
};

export type GetDocResponse = {
  data: any;
  ref: {
    id: string;
    path: string;
  };
  isExists: boolean;
};

export type GetCollectionBody = {
  collectionPath: string;
};

export type GetCollectionResponse = {
  docsArray: GetDocResponse[];
};
