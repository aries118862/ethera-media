import ContentCard from './ContentCard.jsx';

export default function ContentGrid({ contents, featuredId, variant, creatorProfile }) {
  if (!contents.length) {
    return <div className="empty-state"><span className="empty-sparkle">✳</span><h3>No stories just yet</h3><p>Check back soon for something new to read, watch, or listen to.</p></div>;
  }
  return <div className={variant === 'feed' ? 'social-feed-list' : 'content-grid'}>{contents.map((content) => <ContentCard key={content._id} content={content} featured={content._id === featuredId} variant={variant} creatorProfile={creatorProfile} />)}</div>;
}
