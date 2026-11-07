import { ArrowLeft, Check, ImagePlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../services/api.js';

const initialForm = { title: '', description: '', category: '', type: 'Article', thumbnailUrl: '', mediaUrl: '', articleContent: '', status: 'Draft', scheduledAt: '', featured: false };
const defaultCategories = ['Education', 'Technology', 'Entertainment', 'Lifestyle'];

export default function ContentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState(defaultCategories);
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    const requests = [apiRequest('/contents?all=true')];
    if (id && id !== 'new') requests.push(apiRequest(`/contents/${id}`));

    Promise.all(requests)
      .then(([library, current]) => {
        const existingCategories = (library.contents || []).map((content) => content.category).filter(Boolean);
        const categoryOptions = [...new Set([...defaultCategories, ...existingCategories])].sort((a, b) => a.localeCompare(b));
        setCategories(categoryOptions);
        if (current?.content) {
          setForm({
            ...initialForm,
            ...current.content,
            scheduledAt: current.content.scheduledAt ? new Date(current.content.scheduledAt).toISOString().slice(0, 16) : '',
          });
          if (!categoryOptions.includes(current.content.category)) setCreatingCategory(true);
        }
      })
      .catch((requestError) => setError(requestError.message));
  }, [id]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveContent(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const body = { ...form, scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null };
    try {
      await apiRequest(id && id !== 'new' ? `/contents/${id}` : '/contents', {
        method: id && id !== 'new' ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });
      navigate('/dashboard/content');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="editor-page">
      <button className="dashboard-back" onClick={() => navigate('/dashboard/content')}><ArrowLeft size={16} /> Back to content</button>
      <div className="dashboard-title-row"><div><span className="eyebrow">THE CREATOR STUDIO</span><h1>{id && id !== 'new' ? 'Edit your story' : 'Create something new'}</h1></div></div>
      <form className="editor-form" onSubmit={saveContent}>
        <div className="editor-main">
          <label>Story title<input value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Give your story a name..." maxLength="140" required /></label>
          <label>A short introduction<textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="What is this story about?" rows="3" maxLength="5000" required /></label>
          <label>Story content<textarea value={form.articleContent} onChange={(event) => update('articleContent', event.target.value)} placeholder="Write the full article here, or add a link to a video or podcast below..." rows="10" /></label>
          <div className="editor-two-col">
            <label>Media link<input type="url" value={form.mediaUrl} onChange={(event) => update('mediaUrl', event.target.value)} placeholder="https://..." /></label>
            <label>Cover image URL<input type="url" value={form.thumbnailUrl} onChange={(event) => update('thumbnailUrl', event.target.value)} placeholder="https://..." /></label>
          </div>
          {form.thumbnailUrl && <div className="image-preview"><img src={form.thumbnailUrl} alt="Cover preview" onError={(event) => { event.currentTarget.style.display = 'none'; }} /><span><ImagePlus size={15} /> Cover preview</span></div>}
        </div>
        <aside className="editor-settings">
          <div className="settings-title">Story settings</div>
          <label>Category
            {!creatingCategory
              ? <select value={form.category} onChange={(event) => {
                if (event.target.value === '__new_category__') {
                  update('category', '');
                  setCreatingCategory(true);
                } else {
                  update('category', event.target.value);
                }
              }} required>
                <option value="">Choose a category</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                <option value="__new_category__">+ Create a new category</option>
              </select>
              : <span className="new-category-field"><input value={form.category} onChange={(event) => update('category', event.target.value)} placeholder="Enter a category name" maxLength="60" required /><button type="button" onClick={() => { setCreatingCategory(false); update('category', categories[0] || ''); }}>Choose existing</button></span>}
          </label>
          <label>Format<select value={form.type} onChange={(event) => update('type', event.target.value)}><option>Article</option><option>Video</option><option>Image</option><option>Podcast</option></select></label>
          <label>Publication status<select value={form.status} onChange={(event) => update('status', event.target.value)}><option>Draft</option><option>Published</option><option>Scheduled</option></select></label>
          {form.status === 'Scheduled' && <label>Publish date & time<input type="datetime-local" value={form.scheduledAt} onChange={(event) => update('scheduledAt', event.target.value)} required /></label>}
          <label className="featured-toggle"><input type="checkbox" checked={form.featured} onChange={(event) => update('featured', event.target.checked)} /><span>Feature on homepage</span></label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="button button-dark save-button" disabled={saving}>{saving ? 'Saving...' : 'Save story'} <Check size={16} /></button>
          <p className="settings-note">Changes are saved to your creator library.</p>
        </aside>
      </form>
    </div>
  );
}
