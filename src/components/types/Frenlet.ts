/**
 * Can be used on Firebase Firestore.
 */
export type FrenletServerData = {
  commentCount: number;
  comments: { comment: string; sender: string; ts: number }[];
  frenletDocId: string;
  frenletSender: string;
  frenletReceiver: string;
  likeCount: number;
  likes: string[];
  message: string;
  replies: { sender: string; message: string; ts: number }[];
  ts: number;
};
