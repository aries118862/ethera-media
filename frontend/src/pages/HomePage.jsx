import { ArrowDown, ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ContentGrid from '../components/ContentGrid.jsx';
import LoadingState from '../components/LoadingState.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import { useCreatorProfile } from '../context/CreatorProfileContext.jsx';
import { apiRequest, mediaImage } from '../services/api.js';

export default function HomePage() {
  const signedIn = Boolean(localStorage.getItem('ethera-token'));
  const { profile } = useCreatorProfile();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/contents')
      .then((contentResult) => {
        setContents(contentResult.contents || []);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const featured = contents.find((item) => item.featured) || contents[0];
  const latest = contents.filter((item) => item._id !== featured?._id).slice(0, 3);

  return (
    <main>
      <section className="hero-section">
        <div className="hero-orbit hero-orbit-one" /><div className="hero-orbit hero-orbit-two" />
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="hero-kicker"><span className="live-dot" /> A JOURNAL BY {profile.name.toUpperCase()}</div>
            <h1>Stories worth<br /><em>staying for.</em></h1>
            <p>{profile.introduction}</p>
            <div className="hero-actions"><Link className="button button-dark" to={signedIn ? '/explore' : '/login'}>{signedIn ? 'Explore the journal' : 'Sign in or join free'} <ArrowRight size={16} /></Link>{signedIn ? <a className="text-link" href="#latest">Find your next favorite <ArrowDown size={15} /></a> : <span className="text-link">Creators: continue with Google · Viewers: sign in with email</span>}</div>
          </div>
          <div className="hero-art">
            <div className="hero-image-frame">
              <img src={mediaImage(featured?.thumbnailUrl, profile.imageUrl || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1100&q=85')} alt="An open notebook and a warm cup of coffee" />
              <div className="image-caption"><span>THE CREATOR'S NOTEBOOK</span><Sparkles size={16} /></div>
            </div>
            <div className="hero-sticker"><span>MADE WITH</span><span className="sticker-heart">♥</span><span>INTENTION</span></div>
            <div className="hero-art-caption">Ideas to keep<br />close by <span>↗</span></div>
          </div>
          <div className="hero-index"><span>01</span><span className="index-line" /><span>THE JOURNAL</span></div>
        </div>
      </section>

      <section className="latest-section section-wrap" id="latest">
        <SectionHeading eyebrow="Fresh from the studio" title="The latest stories" action={<Link className="underlined-link" to="/explore">All stories <ArrowUpRight size={15} /></Link>} />
        {error && <div className="notice notice-error">{error}</div>}
        {loading ? <LoadingState /> : <ContentGrid contents={featured ? [featured, ...latest] : latest} featuredId={featured?._id} />}
      </section>

      {!signedIn && <section className="gated-stories-section section-wrap">
        <span className="eyebrow">A community for curious minds</span>
        <h2>Stories are better <em>together.</em></h2>
        <p>Join Ethera to like videos and take part in the conversation.</p>
        <Link className="button button-dark" to="/login">Join the community <ArrowRight size={15} /></Link>
      </section>}

      <section className="manifesto-section">
        <div className="manifesto-inner"><span className="eyebrow">A note on why we're here</span><p>Curiosity is a <em>beautiful</em> place to begin.</p><Link to="/explore">Come see what we're making <ArrowRight size={16} /></Link></div>
        <div className="manifesto-flower">✳</div>
      </section>

      <section className="newsletter-section section-wrap">
        <div><span className="eyebrow">A little note in your inbox</span><h2>Good things,<br /><em>occasionally.</em></h2></div>
        <div className="newsletter-copy"><p>Thoughtful reads and fresh inspiration, sent only when there's something worth sharing.</p><span className="newsletter-note">No noise. Unsubscribe whenever. <span>♡</span></span></div>
        <div className="newsletter-form"><input type="email" placeholder="Your email address" aria-label="Your email address" /><button type="button" onClick={() => window.alert('Newsletter sign-up is coming soon.')}>Count me in <ArrowRight size={15} /></button></div>
      </section>
    </main>
  );
}
