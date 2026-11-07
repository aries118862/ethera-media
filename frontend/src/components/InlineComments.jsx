import CommentThread from './CommentThread.jsx';

export default function InlineComments({ contentId, onCountChange }) {
  return <CommentThread contentId={contentId} inline onCountChange={onCountChange} />;
}
